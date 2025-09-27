import os
import shutil
import sys
import tempfile
from unittest.mock import MagicMock, Mock, patch

import pytest

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Course, CourseChunk, Lesson
from vector_store import SearchResults, VectorStore


class TestVectorStore:
    """Test cases for VectorStore"""

    def test_search_with_proper_max_results(self, test_config, mock_chroma_collection):
        """Test search with proper MAX_RESULTS setting"""
        with patch("vector_store.chromadb") as mock_chromadb:
            # Setup mocks
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client
            mock_client.get_or_create_collection.return_value = mock_chroma_collection

            # Create vector store with proper config (MAX_RESULTS=5)
            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,  # Should be 5
            )

            # Execute search
            result = vector_store.search("test query")

            # Assert that ChromaDB query was called with proper n_results
            mock_chroma_collection.query.assert_called_once_with(
                query_texts=["test query"],
                n_results=5,  # Should be 5, not 0
                where=None,
            )

            # Verify results
            assert not result.is_empty()
            assert len(result.documents) == 1
            assert result.documents[0] == "Sample document"

    def test_search_with_broken_max_results_zero(
        self, broken_config, mock_chroma_collection
    ):
        """Test the critical MAX_RESULTS=0 issue"""
        with patch("vector_store.chromadb") as mock_chromadb:
            # Setup mocks - simulate empty results when n_results=0
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client

            # Mock collection that returns empty results when n_results=0
            empty_collection = Mock()
            empty_collection.query.return_value = {
                "documents": [[]],  # Empty results due to n_results=0
                "metadatas": [[]],
                "distances": [[]],
            }
            mock_client.get_or_create_collection.return_value = empty_collection

            # Create vector store with broken config (MAX_RESULTS=0)
            vector_store = VectorStore(
                chroma_path=broken_config.CHROMA_PATH,
                embedding_model=broken_config.EMBEDDING_MODEL,
                max_results=broken_config.MAX_RESULTS,  # This is 0!
            )

            # Execute search
            result = vector_store.search("valid query")

            # Assert that ChromaDB query was called with n_results=0
            empty_collection.query.assert_called_once_with(
                query_texts=["valid query"], n_results=0, where=None  # This is the bug!
            )

            # Verify that we get empty results even for valid queries
            assert result.is_empty()
            assert len(result.documents) == 0

            # This demonstrates the root cause of "query failed" responses

    def test_search_with_course_filter(self, test_config, mock_chroma_collection):
        """Test search with course name filter"""
        with patch("vector_store.chromadb") as mock_chromadb:
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client

            # Mock course catalog for course name resolution
            course_catalog = Mock()
            course_catalog.query.return_value = {
                "documents": [["Test Course"]],
                "metadatas": [[{"title": "Test Course"}]],
            }

            # Mock content collection
            content_collection = Mock()
            content_collection.query.return_value = {
                "documents": [["Filtered content"]],
                "metadatas": [[{"course_title": "Test Course", "lesson_number": 1}]],
                "distances": [[0.1]],
            }

            # Setup collection returns
            mock_client.get_or_create_collection.side_effect = [
                course_catalog,
                content_collection,
            ]

            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            # Execute search with course filter
            result = vector_store.search("test query", course_name="Test")

            # Assert course resolution was called
            course_catalog.query.assert_called_once_with(
                query_texts=["Test"], n_results=1
            )

            # Assert content search was called with proper filter
            content_collection.query.assert_called_once_with(
                query_texts=["test query"],
                n_results=5,
                where={"course_title": "Test Course"},
            )

            assert not result.is_empty()
            assert result.documents[0] == "Filtered content"

    def test_search_with_lesson_filter(self, test_config, mock_chroma_collection):
        """Test search with lesson number filter"""
        with patch("vector_store.chromadb") as mock_chromadb:
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client
            mock_client.get_or_create_collection.return_value = mock_chroma_collection

            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            # Execute search with lesson filter
            result = vector_store.search("test query", lesson_number=2)

            # Assert search was called with lesson filter
            mock_chroma_collection.query.assert_called_once_with(
                query_texts=["test query"], n_results=5, where={"lesson_number": 2}
            )

    def test_search_with_both_filters(self, test_config):
        """Test search with both course and lesson filters"""
        with patch("vector_store.chromadb") as mock_chromadb:
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client

            # Mock course catalog
            course_catalog = Mock()
            course_catalog.query.return_value = {
                "documents": [["Specific Course"]],
                "metadatas": [[{"title": "Specific Course"}]],
            }

            # Mock content collection
            content_collection = Mock()
            content_collection.query.return_value = {
                "documents": [["Specific content"]],
                "metadatas": [
                    [{"course_title": "Specific Course", "lesson_number": 3}]
                ],
                "distances": [[0.1]],
            }

            mock_client.get_or_create_collection.side_effect = [
                course_catalog,
                content_collection,
            ]

            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            # Execute search with both filters
            result = vector_store.search(
                "test query", course_name="Specific", lesson_number=3
            )

            # Assert content search was called with combined filter
            expected_filter = {
                "$and": [{"course_title": "Specific Course"}, {"lesson_number": 3}]
            }
            content_collection.query.assert_called_once_with(
                query_texts=["test query"], n_results=5, where=expected_filter
            )

    def test_resolve_course_name_success(self, test_config):
        """Test successful course name resolution"""
        with patch("vector_store.chromadb") as mock_chromadb:
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client

            # Mock course catalog with matching course
            course_catalog = Mock()
            course_catalog.query.return_value = {
                "documents": [["Building Towards Computer Use with Anthropic"]],
                "metadatas": [
                    [{"title": "Building Towards Computer Use with Anthropic"}]
                ],
            }

            content_collection = Mock()
            mock_client.get_or_create_collection.side_effect = [
                course_catalog,
                content_collection,
            ]

            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            # Test course name resolution
            resolved_name = vector_store._resolve_course_name("Anthropic")

            assert resolved_name == "Building Towards Computer Use with Anthropic"
            course_catalog.query.assert_called_once_with(
                query_texts=["Anthropic"], n_results=1
            )

    def test_resolve_course_name_not_found(self, test_config):
        """Test course name resolution when course not found"""
        with patch("vector_store.chromadb") as mock_chromadb:
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client

            # Mock course catalog with no results
            course_catalog = Mock()
            course_catalog.query.return_value = {
                "documents": [[]],  # No matching courses
                "metadatas": [[]],
            }

            content_collection = Mock()
            mock_client.get_or_create_collection.side_effect = [
                course_catalog,
                content_collection,
            ]

            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            # Test course name resolution failure
            resolved_name = vector_store._resolve_course_name("NonexistentCourse")

            assert resolved_name is None

    def test_search_course_not_found(self, test_config):
        """Test search when course name cannot be resolved"""
        with patch("vector_store.chromadb") as mock_chromadb:
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client

            # Mock course catalog with no results
            course_catalog = Mock()
            course_catalog.query.return_value = {"documents": [[]], "metadatas": [[]]}

            content_collection = Mock()
            mock_client.get_or_create_collection.side_effect = [
                course_catalog,
                content_collection,
            ]

            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            # Execute search with nonexistent course
            result = vector_store.search("test query", course_name="NonexistentCourse")

            # Should return error result
            assert result.error == "No course found matching 'NonexistentCourse'"
            assert result.is_empty()

    def test_search_database_error(self, test_config):
        """Test search when database query fails"""
        with patch("vector_store.chromadb") as mock_chromadb:
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client

            # Mock collections
            course_catalog = Mock()
            content_collection = Mock()
            content_collection.query.side_effect = Exception(
                "Database connection failed"
            )

            mock_client.get_or_create_collection.side_effect = [
                course_catalog,
                content_collection,
            ]

            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            # Execute search that will fail
            result = vector_store.search("test query")

            # Should return error result
            assert result.error == "Search error: Database connection failed"
            assert result.is_empty()

    def test_build_filter_no_filters(self, test_config):
        """Test filter building with no filters"""
        with patch("vector_store.chromadb"):
            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            filter_dict = vector_store._build_filter(None, None)
            assert filter_dict is None

    def test_build_filter_course_only(self, test_config):
        """Test filter building with course filter only"""
        with patch("vector_store.chromadb"):
            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            filter_dict = vector_store._build_filter("Test Course", None)
            assert filter_dict == {"course_title": "Test Course"}

    def test_build_filter_lesson_only(self, test_config):
        """Test filter building with lesson filter only"""
        with patch("vector_store.chromadb"):
            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            filter_dict = vector_store._build_filter(None, 2)
            assert filter_dict == {"lesson_number": 2}

    def test_build_filter_both(self, test_config):
        """Test filter building with both filters"""
        with patch("vector_store.chromadb"):
            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            filter_dict = vector_store._build_filter("Test Course", 2)
            expected = {"$and": [{"course_title": "Test Course"}, {"lesson_number": 2}]}
            assert filter_dict == expected

    def test_add_course_metadata(self, test_config, sample_course):
        """Test adding course metadata to vector store"""
        with patch("vector_store.chromadb") as mock_chromadb:
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client

            course_catalog = Mock()
            content_collection = Mock()
            mock_client.get_or_create_collection.side_effect = [
                course_catalog,
                content_collection,
            ]

            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            # Add course metadata
            vector_store.add_course_metadata(sample_course)

            # Verify course catalog add was called
            course_catalog.add.assert_called_once()
            call_args = course_catalog.add.call_args

            assert call_args[1]["documents"] == [sample_course.title]
            assert call_args[1]["ids"] == [sample_course.title]

            metadata = call_args[1]["metadatas"][0]
            assert metadata["title"] == sample_course.title
            assert metadata["instructor"] == sample_course.instructor
            assert metadata["course_link"] == sample_course.course_link
            assert metadata["lesson_count"] == len(sample_course.lessons)
            assert "lessons_json" in metadata

    def test_add_course_content(self, test_config, sample_course_chunks):
        """Test adding course content chunks to vector store"""
        with patch("vector_store.chromadb") as mock_chromadb:
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client

            course_catalog = Mock()
            content_collection = Mock()
            mock_client.get_or_create_collection.side_effect = [
                course_catalog,
                content_collection,
            ]

            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            # Add course content
            vector_store.add_course_content(sample_course_chunks)

            # Verify content collection add was called
            content_collection.add.assert_called_once()
            call_args = content_collection.add.call_args

            assert len(call_args[1]["documents"]) == len(sample_course_chunks)
            assert len(call_args[1]["metadatas"]) == len(sample_course_chunks)
            assert len(call_args[1]["ids"]) == len(sample_course_chunks)

            # Check first chunk
            assert call_args[1]["documents"][0] == sample_course_chunks[0].content
            assert (
                call_args[1]["metadatas"][0]["course_title"]
                == sample_course_chunks[0].course_title
            )
            assert (
                call_args[1]["metadatas"][0]["lesson_number"]
                == sample_course_chunks[0].lesson_number
            )

    def test_get_lesson_link(self, test_config):
        """Test retrieving lesson link"""
        with patch("vector_store.chromadb") as mock_chromadb:
            mock_client = Mock()
            mock_chromadb.PersistentClient.return_value = mock_client

            # Mock course catalog with lesson data
            course_catalog = Mock()
            course_catalog.get.return_value = {
                "metadatas": [
                    {
                        "lessons_json": '[{"lesson_number": 1, "lesson_title": "Test Lesson", "lesson_link": "https://example.com/lesson1"}]'
                    }
                ]
            }

            content_collection = Mock()
            mock_client.get_or_create_collection.side_effect = [
                course_catalog,
                content_collection,
            ]

            vector_store = VectorStore(
                chroma_path=test_config.CHROMA_PATH,
                embedding_model=test_config.EMBEDDING_MODEL,
                max_results=test_config.MAX_RESULTS,
            )

            # Get lesson link
            link = vector_store.get_lesson_link("Test Course", 1)

            assert link == "https://example.com/lesson1"
            course_catalog.get.assert_called_once_with(ids=["Test Course"])

    def test_search_results_from_chroma(self):
        """Test SearchResults.from_chroma method"""
        chroma_results = {
            "documents": [["doc1", "doc2"]],
            "metadatas": [[{"meta1": "value1"}, {"meta2": "value2"}]],
            "distances": [[0.1, 0.2]],
        }

        results = SearchResults.from_chroma(chroma_results)

        assert results.documents == ["doc1", "doc2"]
        assert results.metadata == [{"meta1": "value1"}, {"meta2": "value2"}]
        assert results.distances == [0.1, 0.2]
        assert results.error is None
        assert not results.is_empty()

    def test_search_results_empty(self):
        """Test SearchResults.empty method"""
        results = SearchResults.empty("Test error message")

        assert results.documents == []
        assert results.metadata == []
        assert results.distances == []
        assert results.error == "Test error message"
        assert results.is_empty()
