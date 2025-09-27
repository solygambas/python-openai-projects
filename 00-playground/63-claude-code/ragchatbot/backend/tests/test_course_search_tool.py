import os
import sys
from unittest.mock import Mock, patch

import pytest

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from search_tools import CourseSearchTool
from vector_store import SearchResults


class TestCourseSearchTool:
    """Test cases for CourseSearchTool"""

    def test_execute_successful_search(self, mock_vector_store, sample_search_results):
        """Test successful search with results"""
        # Setup
        mock_vector_store.search.return_value = sample_search_results
        tool = CourseSearchTool(mock_vector_store)

        # Execute
        result = tool.execute("test query")

        # Assert
        assert "[Building Towards Computer Use with Anthropic - Lesson 1]" in result
        assert "[Building Towards Computer Use with Anthropic - Lesson 2]" in result
        assert "Welcome to Building Toward Computer Use" in result
        assert "advanced topics including tool calling" in result

        # Verify vector store was called correctly
        mock_vector_store.search.assert_called_once_with(
            query="test query", course_name=None, lesson_number=None
        )

    def test_execute_with_course_filter(self, mock_vector_store, sample_search_results):
        """Test search with course name filter"""
        # Setup
        mock_vector_store.search.return_value = sample_search_results
        tool = CourseSearchTool(mock_vector_store)

        # Execute
        result = tool.execute("test query", course_name="Anthropic Course")

        # Assert
        assert "Building Towards Computer Use" in result
        mock_vector_store.search.assert_called_once_with(
            query="test query", course_name="Anthropic Course", lesson_number=None
        )

    def test_execute_with_lesson_filter(self, mock_vector_store, sample_search_results):
        """Test search with lesson number filter"""
        # Setup
        mock_vector_store.search.return_value = sample_search_results
        tool = CourseSearchTool(mock_vector_store)

        # Execute
        result = tool.execute("test query", lesson_number=2)

        # Assert
        assert "Building Towards Computer Use" in result
        mock_vector_store.search.assert_called_once_with(
            query="test query", course_name=None, lesson_number=2
        )

    def test_execute_with_both_filters(self, mock_vector_store, sample_search_results):
        """Test search with both course and lesson filters"""
        # Setup
        mock_vector_store.search.return_value = sample_search_results
        tool = CourseSearchTool(mock_vector_store)

        # Execute
        result = tool.execute(
            "test query", course_name="Anthropic Course", lesson_number=1
        )

        # Assert
        assert "Building Towards Computer Use" in result
        mock_vector_store.search.assert_called_once_with(
            query="test query", course_name="Anthropic Course", lesson_number=1
        )

    def test_execute_empty_results(self, mock_vector_store, empty_search_results):
        """Test handling of empty search results"""
        # Setup
        mock_vector_store.search.return_value = empty_search_results
        tool = CourseSearchTool(mock_vector_store)

        # Execute
        result = tool.execute("nonexistent query")

        # Assert
        assert result == "No relevant content found."

    def test_execute_empty_results_with_filters(
        self, mock_vector_store, empty_search_results
    ):
        """Test empty results with filter information"""
        # Setup
        mock_vector_store.search.return_value = empty_search_results
        tool = CourseSearchTool(mock_vector_store)

        # Execute
        result = tool.execute(
            "test query", course_name="Missing Course", lesson_number=5
        )

        # Assert
        expected = "No relevant content found in course 'Missing Course' in lesson 5."
        assert result == expected

    def test_execute_search_error(self, mock_vector_store, error_search_results):
        """Test handling of search errors"""
        # Setup
        mock_vector_store.search.return_value = error_search_results
        tool = CourseSearchTool(mock_vector_store)

        # Execute
        result = tool.execute("test query")

        # Assert
        assert result == "Search error: Database connection failed"

    def test_execute_max_results_zero_issue(self, mock_vector_store):
        """Test the critical MAX_RESULTS=0 issue"""
        # Setup - simulate the behavior when MAX_RESULTS=0 causes no results
        empty_results = SearchResults(documents=[], metadata=[], distances=[])
        mock_vector_store.search.return_value = empty_results
        tool = CourseSearchTool(mock_vector_store)

        # Execute
        result = tool.execute("valid query about course content")

        # Assert - this should return no content found due to MAX_RESULTS=0
        assert result == "No relevant content found."

        # This test demonstrates the bug: even with valid queries, we get no results
        # when MAX_RESULTS=0 because the vector store returns empty results

    def test_format_results_with_lesson_links(self, mock_vector_store):
        """Test that lesson links are properly retrieved and stored"""
        # Setup
        search_results = SearchResults(
            documents=["Test content"],
            metadata=[
                {"course_title": "Test Course", "lesson_number": 1, "chunk_index": 0}
            ],
            distances=[0.1],
        )
        mock_vector_store.search.return_value = search_results
        mock_vector_store.get_lesson_link.return_value = "https://example.com/lesson1"

        tool = CourseSearchTool(mock_vector_store)

        # Execute
        result = tool.execute("test query")

        # Assert
        assert "[Test Course - Lesson 1]" in result
        assert "Test content" in result

        # Verify lesson link was requested
        mock_vector_store.get_lesson_link.assert_called_once_with("Test Course", 1)

        # Check that sources and links are tracked
        assert tool.last_sources == ["Test Course - Lesson 1"]
        assert tool.last_source_links == ["https://example.com/lesson1"]

    def test_format_results_without_lesson_number(self, mock_vector_store):
        """Test formatting when lesson_number is None"""
        # Setup
        search_results = SearchResults(
            documents=["Test content"],
            metadata=[
                {"course_title": "Test Course", "chunk_index": 0}
            ],  # No lesson_number
            distances=[0.1],
        )
        mock_vector_store.search.return_value = search_results

        tool = CourseSearchTool(mock_vector_store)

        # Execute
        result = tool.execute("test query")

        # Assert - should not include lesson number in header
        assert "[Test Course]" in result
        assert "Test content" in result

        # Check sources tracking
        assert tool.last_sources == ["Test Course"]
        assert tool.last_source_links == [None]

    def test_get_tool_definition(self, mock_vector_store):
        """Test that tool definition is properly structured"""
        # Setup
        tool = CourseSearchTool(mock_vector_store)

        # Execute
        definition = tool.get_tool_definition()

        # Assert
        assert definition["name"] == "search_course_content"
        assert "description" in definition
        assert "input_schema" in definition

        schema = definition["input_schema"]
        assert schema["type"] == "object"
        assert "query" in schema["properties"]
        assert "course_name" in schema["properties"]
        assert "lesson_number" in schema["properties"]
        assert schema["required"] == ["query"]

    def test_source_tracking_reset(self, mock_vector_store, sample_search_results):
        """Test that sources are properly tracked and can be reset"""
        # Setup
        tool = CourseSearchTool(mock_vector_store)
        mock_vector_store.search.return_value = sample_search_results

        # Execute first search
        tool.execute("first query")
        first_sources = tool.last_sources.copy()
        first_links = tool.last_source_links.copy()

        # Verify sources are tracked
        assert len(first_sources) > 0
        assert len(first_links) > 0

        # Execute second search with empty results
        mock_vector_store.search.return_value = SearchResults([], [], [])
        tool.execute("second query")

        # Verify sources are cleared for empty results
        assert tool.last_sources == []
        assert tool.last_source_links == []

    def test_multiple_documents_formatting(self, mock_vector_store):
        """Test formatting when multiple documents are returned"""
        # Setup
        multi_results = SearchResults(
            documents=[
                "First document content about AI",
                "Second document about machine learning",
                "Third document about computer vision",
            ],
            metadata=[
                {"course_title": "AI Course", "lesson_number": 1, "chunk_index": 0},
                {"course_title": "AI Course", "lesson_number": 2, "chunk_index": 1},
                {"course_title": "ML Course", "lesson_number": 1, "chunk_index": 0},
            ],
            distances=[0.1, 0.2, 0.3],
        )
        mock_vector_store.search.return_value = multi_results
        mock_vector_store.get_lesson_link.side_effect = [
            "https://example.com/ai1",
            "https://example.com/ai2",
            "https://example.com/ml1",
        ]

        tool = CourseSearchTool(mock_vector_store)

        # Execute
        result = tool.execute("test query")

        # Assert all documents are included
        assert "[AI Course - Lesson 1]" in result
        assert "[AI Course - Lesson 2]" in result
        assert "[ML Course - Lesson 1]" in result
        assert "First document content about AI" in result
        assert "Second document about machine learning" in result
        assert "Third document about computer vision" in result

        # Verify all sources are tracked
        expected_sources = [
            "AI Course - Lesson 1",
            "AI Course - Lesson 2",
            "ML Course - Lesson 1",
        ]
        expected_links = [
            "https://example.com/ai1",
            "https://example.com/ai2",
            "https://example.com/ml1",
        ]

        assert tool.last_sources == expected_sources
        assert tool.last_source_links == expected_links
