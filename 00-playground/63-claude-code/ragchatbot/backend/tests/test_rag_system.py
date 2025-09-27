import os
import sys
import tempfile
from unittest.mock import MagicMock, Mock, patch

import pytest

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Course, CourseChunk, Lesson
from rag_system import RAGSystem


class TestRAGSystem:
    """Test cases for RAGSystem end-to-end integration"""

    def test_init_with_proper_config(self, test_config):
        """Test RAGSystem initialization with proper configuration"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore"),
            patch("rag_system.AIGenerator"),
            patch("rag_system.SessionManager"),
        ):

            rag_system = RAGSystem(test_config)

            # Verify components are initialized
            assert rag_system.config == test_config
            assert rag_system.document_processor is not None
            assert rag_system.vector_store is not None
            assert rag_system.ai_generator is not None
            assert rag_system.session_manager is not None
            assert rag_system.tool_manager is not None
            assert rag_system.search_tool is not None
            assert rag_system.outline_tool is not None

    def test_init_with_broken_config(self, broken_config):
        """Test RAGSystem initialization with broken MAX_RESULTS=0 config"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore") as mock_vector_store,
            patch("rag_system.AIGenerator"),
            patch("rag_system.SessionManager"),
        ):

            rag_system = RAGSystem(broken_config)

            # Verify VectorStore was initialized with broken config
            mock_vector_store.assert_called_once_with(
                broken_config.CHROMA_PATH,
                broken_config.EMBEDDING_MODEL,
                0,  # This is the broken MAX_RESULTS=0 value
            )

    def test_query_successful_with_tool_use(self, test_config):
        """Test successful query processing with tool usage"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore"),
            patch("rag_system.AIGenerator") as mock_ai_gen,
            patch("rag_system.SessionManager") as mock_session,
        ):

            # Setup mocks
            mock_ai_gen.return_value.generate_response.return_value = (
                "Based on the course content, here's the answer."
            )
            mock_session.return_value.get_conversation_history.return_value = None

            rag_system = RAGSystem(test_config)

            # Mock tool manager to return sources
            rag_system.tool_manager.get_last_sources = Mock(
                return_value=["Course 1 - Lesson 1"]
            )
            rag_system.tool_manager.get_last_source_links = Mock(
                return_value=["https://example.com/lesson1"]
            )

            # Execute query
            response, sources, source_links = rag_system.query(
                "What is covered in lesson 1?"
            )

            # Assert
            assert response == "Based on the course content, here's the answer."
            assert sources == ["Course 1 - Lesson 1"]
            assert source_links == ["https://example.com/lesson1"]

            # Verify AI generator was called with tools
            mock_ai_gen.return_value.generate_response.assert_called_once()
            call_args = mock_ai_gen.return_value.generate_response.call_args[1]
            assert "tools" in call_args
            assert "tool_manager" in call_args

    def test_query_with_session_history(self, test_config):
        """Test query processing with conversation history"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore"),
            patch("rag_system.AIGenerator") as mock_ai_gen,
            patch("rag_system.SessionManager") as mock_session,
        ):

            # Setup mocks
            mock_ai_gen.return_value.generate_response.return_value = (
                "Follow-up response."
            )
            mock_session.return_value.get_conversation_history.return_value = (
                "Previous conversation"
            )

            rag_system = RAGSystem(test_config)
            rag_system.tool_manager.get_last_sources = Mock(return_value=[])
            rag_system.tool_manager.get_last_source_links = Mock(return_value=[])

            # Execute query with session
            response, sources, source_links = rag_system.query(
                "Follow up question", session_id="session123"
            )

            # Assert
            assert response == "Follow-up response."

            # Verify session history was used
            mock_session.return_value.get_conversation_history.assert_called_once_with(
                "session123"
            )
            call_args = mock_ai_gen.return_value.generate_response.call_args[1]
            assert call_args["conversation_history"] == "Previous conversation"

            # Verify session was updated
            mock_session.return_value.add_exchange.assert_called_once_with(
                "session123",
                "Answer this question about course materials: Follow up question",
                "Follow-up response.",
            )

    def test_query_failed_scenario_max_results_zero(self, broken_config):
        """Test the 'query failed' scenario due to MAX_RESULTS=0"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore") as mock_vector_store,
            patch("rag_system.AIGenerator") as mock_ai_gen,
            patch("rag_system.SessionManager"),
        ):

            # Setup broken vector store that returns empty results due to MAX_RESULTS=0
            mock_vector_store_instance = Mock()
            mock_vector_store.return_value = mock_vector_store_instance

            # Mock AI generator response when tools return no content
            mock_ai_gen.return_value.generate_response.return_value = (
                "I couldn't find any relevant information."
            )

            rag_system = RAGSystem(broken_config)

            # Mock tool manager to simulate no results found (due to MAX_RESULTS=0)
            rag_system.tool_manager.get_last_sources = Mock(return_value=[])
            rag_system.tool_manager.get_last_source_links = Mock(return_value=[])

            # Execute query that should find content but doesn't due to config issue
            response, sources, source_links = rag_system.query(
                "What is covered in the course?"
            )

            # Assert we get an unhelpful response due to the configuration bug
            assert "couldn't find" in response.lower() or "no" in response.lower()
            assert sources == []
            assert source_links == []

            # This demonstrates the "query failed" behavior

    def test_query_with_no_session(self, test_config):
        """Test query processing without session ID"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore"),
            patch("rag_system.AIGenerator") as mock_ai_gen,
            patch("rag_system.SessionManager") as mock_session,
        ):

            mock_ai_gen.return_value.generate_response.return_value = (
                "Response without session."
            )

            rag_system = RAGSystem(test_config)
            rag_system.tool_manager.get_last_sources = Mock(return_value=[])
            rag_system.tool_manager.get_last_source_links = Mock(return_value=[])

            # Execute query without session
            response, sources, source_links = rag_system.query("What is AI?")

            # Assert
            assert response == "Response without session."

            # Verify no session operations were called
            mock_session.return_value.get_conversation_history.assert_not_called()
            mock_session.return_value.add_exchange.assert_not_called()

    def test_add_course_document_success(self, test_config, sample_course):
        """Test adding a single course document"""
        with (
            patch("rag_system.DocumentProcessor") as mock_doc_proc,
            patch("rag_system.VectorStore") as mock_vector_store,
            patch("rag_system.AIGenerator"),
            patch("rag_system.SessionManager"),
        ):

            # Setup mocks
            mock_chunks = [
                CourseChunk(
                    content="chunk1", course_title="Test Course", chunk_index=0
                ),
                CourseChunk(
                    content="chunk2", course_title="Test Course", chunk_index=1
                ),
            ]
            mock_doc_proc.return_value.process_course_document.return_value = (
                sample_course,
                mock_chunks,
            )

            rag_system = RAGSystem(test_config)

            # Execute
            course, chunk_count = rag_system.add_course_document("/path/to/course.pdf")

            # Assert
            assert course == sample_course
            assert chunk_count == 2

            # Verify document was processed
            mock_doc_proc.return_value.process_course_document.assert_called_once_with(
                "/path/to/course.pdf"
            )

            # Verify data was added to vector store
            mock_vector_store.return_value.add_course_metadata.assert_called_once_with(
                sample_course
            )
            mock_vector_store.return_value.add_course_content.assert_called_once_with(
                mock_chunks
            )

    def test_add_course_document_error(self, test_config):
        """Test error handling when document processing fails"""
        with (
            patch("rag_system.DocumentProcessor") as mock_doc_proc,
            patch("rag_system.VectorStore"),
            patch("rag_system.AIGenerator"),
            patch("rag_system.SessionManager"),
        ):

            # Setup mock to raise exception
            mock_doc_proc.return_value.process_course_document.side_effect = Exception(
                "Processing failed"
            )

            rag_system = RAGSystem(test_config)

            # Execute
            course, chunk_count = rag_system.add_course_document(
                "/path/to/bad_course.pdf"
            )

            # Assert error handling
            assert course is None
            assert chunk_count == 0

    def test_add_course_folder_success(self, test_config):
        """Test adding multiple course documents from folder"""
        with (
            patch("rag_system.DocumentProcessor") as mock_doc_proc,
            patch("rag_system.VectorStore") as mock_vector_store,
            patch("rag_system.AIGenerator"),
            patch("rag_system.SessionManager"),
            patch("os.path.exists") as mock_exists,
            patch("os.listdir") as mock_listdir,
        ):

            # Setup mocks
            mock_exists.return_value = True
            mock_listdir.return_value = [
                "course1.pdf",
                "course2.txt",
                "course3.docx",
                "ignore.jpg",
            ]
            mock_vector_store.return_value.get_existing_course_titles.return_value = []

            # Mock document processing
            courses = [
                Course(title="Course 1", lessons=[]),
                Course(title="Course 2", lessons=[]),
                Course(title="Course 3", lessons=[]),
            ]
            chunks = [
                [CourseChunk(content="c1", course_title="Course 1", chunk_index=0)],
                [CourseChunk(content="c2", course_title="Course 2", chunk_index=0)],
                [CourseChunk(content="c3", course_title="Course 3", chunk_index=0)],
            ]

            mock_doc_proc.return_value.process_course_document.side_effect = [
                (courses[0], chunks[0]),
                (courses[1], chunks[1]),
                (courses[2], chunks[2]),
            ]

            rag_system = RAGSystem(test_config)

            # Execute
            total_courses, total_chunks = rag_system.add_course_folder(
                "/path/to/docs", clear_existing=False
            )

            # Assert
            assert total_courses == 3
            assert total_chunks == 3

            # Verify only PDF, TXT, DOCX files were processed (not JPG)
            assert mock_doc_proc.return_value.process_course_document.call_count == 3

    def test_add_course_folder_with_clear_existing(self, test_config):
        """Test adding courses with clear_existing=True"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore") as mock_vector_store,
            patch("rag_system.AIGenerator"),
            patch("rag_system.SessionManager"),
            patch("os.path.exists") as mock_exists,
            patch("os.listdir") as mock_listdir,
        ):

            mock_exists.return_value = True
            mock_listdir.return_value = []

            rag_system = RAGSystem(test_config)

            # Execute with clear_existing=True
            rag_system.add_course_folder("/path/to/docs", clear_existing=True)

            # Verify data was cleared
            mock_vector_store.return_value.clear_all_data.assert_called_once()

    def test_add_course_folder_skip_existing(self, test_config):
        """Test that existing courses are skipped"""
        with (
            patch("rag_system.DocumentProcessor") as mock_doc_proc,
            patch("rag_system.VectorStore") as mock_vector_store,
            patch("rag_system.AIGenerator"),
            patch("rag_system.SessionManager"),
            patch("os.path.exists") as mock_exists,
            patch("os.listdir") as mock_listdir,
        ):

            mock_exists.return_value = True
            mock_listdir.return_value = ["course1.pdf"]

            # Mock existing course titles
            mock_vector_store.return_value.get_existing_course_titles.return_value = [
                "Existing Course"
            ]

            # Mock document processing to return existing course
            existing_course = Course(title="Existing Course", lessons=[])
            mock_chunks = [
                CourseChunk(
                    content="content", course_title="Existing Course", chunk_index=0
                )
            ]
            mock_doc_proc.return_value.process_course_document.return_value = (
                existing_course,
                mock_chunks,
            )

            rag_system = RAGSystem(test_config)

            # Execute
            total_courses, total_chunks = rag_system.add_course_folder("/path/to/docs")

            # Assert no courses were added (because it was existing)
            assert total_courses == 0
            assert total_chunks == 0

            # Verify add methods were not called
            mock_vector_store.return_value.add_course_metadata.assert_not_called()
            mock_vector_store.return_value.add_course_content.assert_not_called()

    def test_add_course_folder_nonexistent(self, test_config):
        """Test handling of nonexistent folder"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore"),
            patch("rag_system.AIGenerator"),
            patch("rag_system.SessionManager"),
            patch("os.path.exists") as mock_exists,
        ):

            mock_exists.return_value = False

            rag_system = RAGSystem(test_config)

            # Execute
            total_courses, total_chunks = rag_system.add_course_folder(
                "/nonexistent/path"
            )

            # Assert
            assert total_courses == 0
            assert total_chunks == 0

    def test_get_course_analytics(self, test_config):
        """Test course analytics retrieval"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore") as mock_vector_store,
            patch("rag_system.AIGenerator"),
            patch("rag_system.SessionManager"),
        ):

            # Setup mocks
            mock_vector_store.return_value.get_course_count.return_value = 5
            mock_vector_store.return_value.get_existing_course_titles.return_value = [
                "Course 1",
                "Course 2",
                "Course 3",
                "Course 4",
                "Course 5",
            ]

            rag_system = RAGSystem(test_config)

            # Execute
            analytics = rag_system.get_course_analytics()

            # Assert
            assert analytics["total_courses"] == 5
            assert len(analytics["course_titles"]) == 5
            assert "Course 1" in analytics["course_titles"]

    def test_tool_registration(self, test_config):
        """Test that tools are properly registered with tool manager"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore"),
            patch("rag_system.AIGenerator"),
            patch("rag_system.SessionManager"),
        ):

            rag_system = RAGSystem(test_config)

            # Verify tools are registered
            tool_definitions = rag_system.tool_manager.get_tool_definitions()
            tool_names = [tool["name"] for tool in tool_definitions]

            assert "search_course_content" in tool_names
            assert "get_course_outline" in tool_names

    def test_source_tracking_and_reset(self, test_config):
        """Test that sources are properly tracked and reset after queries"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore"),
            patch("rag_system.AIGenerator") as mock_ai_gen,
            patch("rag_system.SessionManager"),
        ):

            mock_ai_gen.return_value.generate_response.return_value = "Test response"

            rag_system = RAGSystem(test_config)

            # Mock tool manager methods
            rag_system.tool_manager.get_last_sources = Mock(return_value=["Source 1"])
            rag_system.tool_manager.get_last_source_links = Mock(
                return_value=["Link 1"]
            )
            rag_system.tool_manager.reset_sources = Mock()

            # Execute query
            response, sources, source_links = rag_system.query("Test query")

            # Assert sources were retrieved
            assert sources == ["Source 1"]
            assert source_links == ["Link 1"]

            # Verify sources were reset after retrieval
            rag_system.tool_manager.reset_sources.assert_called_once()

    def test_end_to_end_query_flow_integration(self, test_config):
        """Test complete end-to-end query processing flow"""
        with (
            patch("rag_system.DocumentProcessor"),
            patch("rag_system.VectorStore"),
            patch("rag_system.AIGenerator") as mock_ai_gen,
            patch("rag_system.SessionManager") as mock_session,
        ):

            # Setup comprehensive mocks
            mock_session.return_value.create_session.return_value = "new_session_123"
            mock_session.return_value.get_conversation_history.return_value = None
            mock_ai_gen.return_value.generate_response.return_value = (
                "Comprehensive answer based on course materials."
            )

            rag_system = RAGSystem(test_config)
            rag_system.tool_manager.get_last_sources = Mock(
                return_value=["Complete Course - Lesson 5"]
            )
            rag_system.tool_manager.get_last_source_links = Mock(
                return_value=["https://example.com/lesson5"]
            )

            # Execute complete flow
            response, sources, source_links = rag_system.query(
                "Explain the complete concept from lesson 5"
            )

            # Assert complete response
            assert "Comprehensive answer" in response
            assert sources == ["Complete Course - Lesson 5"]
            assert source_links == ["https://example.com/lesson5"]

            # Verify AI was called with proper parameters
            call_args = mock_ai_gen.return_value.generate_response.call_args[1]
            assert (
                call_args["query"]
                == "Answer this question about course materials: Explain the complete concept from lesson 5"
            )
            assert "tools" in call_args
            assert "tool_manager" in call_args
