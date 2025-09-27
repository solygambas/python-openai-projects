import os
import sys
from unittest.mock import MagicMock, Mock, patch

import pytest

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_generator import AIGenerator


class TestAIGenerator:
    """Test cases for AIGenerator"""

    def test_init(self):
        """Test AIGenerator initialization"""
        generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

        assert generator.model == "claude-sonnet-4-20250514"
        assert generator.base_params["model"] == "claude-sonnet-4-20250514"
        assert generator.base_params["temperature"] == 0
        assert generator.base_params["max_tokens"] == 800

    def test_generate_response_without_tools(self, mock_anthropic_client):
        """Test basic response generation without tools"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_anthropic.return_value = mock_anthropic_client

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            # Generate response
            response = generator.generate_response("What is AI?")

            # Assert
            assert response == "This is a test response from Claude."

            # Verify API was called correctly
            mock_anthropic_client.messages.create.assert_called_once()
            call_args = mock_anthropic_client.messages.create.call_args[1]

            assert call_args["model"] == "claude-sonnet-4-20250514"
            assert call_args["temperature"] == 0
            assert call_args["max_tokens"] == 800
            assert call_args["messages"] == [{"role": "user", "content": "What is AI?"}]
            assert "tools" not in call_args

    def test_generate_response_with_conversation_history(self, mock_anthropic_client):
        """Test response generation with conversation history"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_anthropic.return_value = mock_anthropic_client

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            history = "Previous conversation context"
            response = generator.generate_response(
                "Follow up question", conversation_history=history
            )

            # Assert
            assert response == "This is a test response from Claude."

            # Verify system prompt includes history
            call_args = mock_anthropic_client.messages.create.call_args[1]
            assert "Previous conversation context" in call_args["system"]

    def test_generate_response_with_tools_no_tool_use(
        self, mock_anthropic_client, mock_tool_manager
    ):
        """Test response generation with tools available but not used"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_anthropic.return_value = mock_anthropic_client

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            tools = mock_tool_manager.get_tool_definitions()
            response = generator.generate_response(
                "What is machine learning?", tools=tools, tool_manager=mock_tool_manager
            )

            # Assert
            assert response == "This is a test response from Claude."

            # Verify tools were passed to API
            call_args = mock_anthropic_client.messages.create.call_args[1]
            assert "tools" in call_args
            assert call_args["tool_choice"] == {"type": "auto"}
            assert call_args["tools"] == tools

    def test_generate_response_with_tool_use(self, mock_tool_manager):
        """Test response generation when Claude requests tool use"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.return_value = mock_client

            # Mock initial response with tool use
            initial_response = Mock()
            initial_response.stop_reason = "tool_use"
            initial_response.content = [Mock()]
            initial_response.content[0].type = "tool_use"
            initial_response.content[0].name = "search_course_content"
            initial_response.content[0].id = "tool_123"
            initial_response.content[0].input = {"query": "test query"}

            # Mock final response after tool execution
            final_response = Mock()
            final_response.content = [Mock()]
            final_response.content[0].text = (
                "Based on the search results, here is the answer."
            )

            # Setup client to return initial then final response
            mock_client.messages.create.side_effect = [initial_response, final_response]

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            tools = mock_tool_manager.get_tool_definitions()
            response = generator.generate_response(
                "What is in lesson 1?", tools=tools, tool_manager=mock_tool_manager
            )

            # Assert
            assert response == "Based on the search results, here is the answer."

            # Verify tool was executed
            mock_tool_manager.execute_tool.assert_called_once_with(
                "search_course_content", query="test query"
            )

            # Verify two API calls were made (initial + final)
            assert mock_client.messages.create.call_count == 2

    def test_generate_response_tool_use_multiple_tools(self, mock_tool_manager):
        """Test response generation when Claude requests multiple tools"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.return_value = mock_client

            # Mock initial response with multiple tool uses
            initial_response = Mock()
            initial_response.stop_reason = "tool_use"

            # Create two tool use content blocks
            tool1 = Mock()
            tool1.type = "tool_use"
            tool1.name = "search_course_content"
            tool1.id = "tool_123"
            tool1.input = {"query": "first query"}

            tool2 = Mock()
            tool2.type = "tool_use"
            tool2.name = "get_course_outline"
            tool2.id = "tool_456"
            tool2.input = {"course_name": "Test Course"}

            initial_response.content = [tool1, tool2]

            # Mock final response
            final_response = Mock()
            final_response.content = [Mock()]
            final_response.content[0].text = "Here's the comprehensive answer."

            mock_client.messages.create.side_effect = [initial_response, final_response]

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            # Execute
            response = generator.generate_response(
                "Tell me about the course",
                tools=mock_tool_manager.get_tool_definitions(),
                tool_manager=mock_tool_manager,
            )

            # Assert
            assert response == "Here's the comprehensive answer."

            # Verify both tools were executed
            assert mock_tool_manager.execute_tool.call_count == 2
            mock_tool_manager.execute_tool.assert_any_call(
                "search_course_content", query="first query"
            )
            mock_tool_manager.execute_tool.assert_any_call(
                "get_course_outline", course_name="Test Course"
            )

    def test_handle_tool_execution_conversation_flow(self, mock_tool_manager):
        """Test that tool execution properly maintains conversation flow"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.return_value = mock_client

            # Mock initial response with tool use
            initial_response = Mock()
            initial_response.stop_reason = "tool_use"
            initial_response.content = [Mock()]
            initial_response.content[0].type = "tool_use"
            initial_response.content[0].name = "search_course_content"
            initial_response.content[0].id = "tool_123"
            initial_response.content[0].input = {"query": "lesson content"}

            # Mock final response
            final_response = Mock()
            final_response.content = [Mock()]
            final_response.content[0].text = "Final answer with tool results."

            mock_client.messages.create.side_effect = [initial_response, final_response]

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            # Execute
            response = generator.generate_response(
                "What's in lesson 1?",
                tools=mock_tool_manager.get_tool_definitions(),
                tool_manager=mock_tool_manager,
            )

            # Verify the conversation flow in the final API call
            final_call_args = mock_client.messages.create.call_args_list[1][1]
            messages = final_call_args["messages"]

            # Should have: user message, assistant tool use, user tool results
            assert len(messages) == 3
            assert messages[0]["role"] == "user"
            assert messages[0]["content"] == "What's in lesson 1?"
            assert messages[1]["role"] == "assistant"
            assert messages[1]["content"] == initial_response.content
            assert messages[2]["role"] == "user"
            assert messages[2]["content"][0]["type"] == "tool_result"
            assert messages[2]["content"][0]["tool_use_id"] == "tool_123"
            assert messages[2]["content"][0]["content"] == "Mock search result"

    def test_generate_response_tool_execution_error(self, mock_tool_manager):
        """Test handling when tool execution fails"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.return_value = mock_client

            # Mock initial response with tool use
            initial_response = Mock()
            initial_response.stop_reason = "tool_use"
            initial_response.content = [Mock()]
            initial_response.content[0].type = "tool_use"
            initial_response.content[0].name = "search_course_content"
            initial_response.content[0].id = "tool_123"
            initial_response.content[0].input = {"query": "test"}

            # Mock final response
            final_response = Mock()
            final_response.content = [Mock()]
            final_response.content[0].text = "I encountered an error searching."

            mock_client.messages.create.side_effect = [initial_response, final_response]

            # Make tool execution return error
            mock_tool_manager.execute_tool.return_value = "Error: Tool execution failed"

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            # Execute
            response = generator.generate_response(
                "Search for something",
                tools=mock_tool_manager.get_tool_definitions(),
                tool_manager=mock_tool_manager,
            )

            # Should still get a response even with tool error
            assert response == "I encountered an error searching."

            # Verify error was passed to Claude in tool result
            final_call_args = mock_client.messages.create.call_args_list[1][1]
            tool_result = final_call_args["messages"][2]["content"][0]
            assert tool_result["content"] == "Error: Tool execution failed"

    def test_system_prompt_content(self):
        """Test that system prompt contains expected guidance"""
        # Test that the static system prompt has the expected content
        assert "course materials and educational content" in AIGenerator.SYSTEM_PROMPT
        assert "Content Search Tool" in AIGenerator.SYSTEM_PROMPT
        assert "Course Outline Tool" in AIGenerator.SYSTEM_PROMPT
        assert "You can make up to 2 rounds of tool calls" in AIGenerator.SYSTEM_PROMPT
        assert "Brief, Concise and focused" in AIGenerator.SYSTEM_PROMPT

    def test_api_parameters_consistency(self, mock_anthropic_client):
        """Test that API parameters are consistent across calls"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_anthropic.return_value = mock_anthropic_client

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            # Make multiple calls
            generator.generate_response("First question")
            generator.generate_response(
                "Second question", conversation_history="Previous context"
            )

            # Verify consistent parameters across calls
            calls = mock_anthropic_client.messages.create.call_args_list

            for call in calls:
                args = call[1]
                assert args["model"] == "claude-sonnet-4-20250514"
                assert args["temperature"] == 0
                assert args["max_tokens"] == 800

    def test_no_tool_manager_with_tool_use(self):
        """Test behavior when tools are requested but no tool_manager provided"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.return_value = mock_client

            # Mock response with tool use
            tool_response = Mock()
            tool_response.stop_reason = "tool_use"
            tool_response.content = [Mock()]
            tool_response.content[0].text = "I need to use a tool"

            mock_client.messages.create.return_value = tool_response

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            # Execute with tools but no tool_manager
            response = generator.generate_response(
                "Search for something", tools=[{"name": "test_tool"}]
            )

            # Should return the text from the tool use response
            assert response == "I need to use a tool"

            # Should only make one API call (no tool execution)
            assert mock_client.messages.create.call_count == 1

    def test_empty_tool_results(self, mock_tool_manager):
        """Test handling when no tool calls are made in tool_use response"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.return_value = mock_client

            # Mock response with tool_use stop_reason but no actual tool calls
            initial_response = Mock()
            initial_response.stop_reason = "tool_use"
            initial_response.content = []  # No tool use blocks

            final_response = Mock()
            final_response.content = [Mock()]
            final_response.content[0].text = "No tools were actually used."

            mock_client.messages.create.side_effect = [initial_response, final_response]

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            # Execute
            response = generator.generate_response(
                "Test query",
                tools=mock_tool_manager.get_tool_definitions(),
                tool_manager=mock_tool_manager,
            )

            # Should still get final response
            assert response == "No tools were actually used."

            # No tools should have been executed
            mock_tool_manager.execute_tool.assert_not_called()

            # Should make two API calls (initial + final)
            assert mock_client.messages.create.call_count == 2

    def test_sequential_tool_calling_two_rounds(self, mock_tool_manager):
        """Test sequential tool calling over 2 rounds"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.return_value = mock_client

            # Round 1: AI makes first tool call
            round1_response = Mock()
            round1_response.stop_reason = "tool_use"
            round1_response.content = [Mock()]
            round1_response.content[0].type = "tool_use"
            round1_response.content[0].name = "get_course_outline"
            round1_response.content[0].id = "tool_1"
            round1_response.content[0].input = {"course_name": "Test Course"}

            # Round 2: AI makes second tool call based on first results
            round2_response = Mock()
            round2_response.stop_reason = "tool_use"
            round2_response.content = [Mock()]
            round2_response.content[0].type = "tool_use"
            round2_response.content[0].name = "search_course_content"
            round2_response.content[0].id = "tool_2"
            round2_response.content[0].input = {"query": "lesson 4 content"}

            # Final response after 2 rounds
            final_response = Mock()
            final_response.content = [Mock()]
            final_response.content[0].text = (
                "Based on the course outline and lesson content, here's the answer."
            )

            mock_client.messages.create.side_effect = [
                round1_response,
                round2_response,
                final_response,
            ]

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            # Execute
            response = generator.generate_response(
                "Find lesson 4 content from Test Course",
                tools=mock_tool_manager.get_tool_definitions(),
                tool_manager=mock_tool_manager,
            )

            # Assert
            assert (
                response
                == "Based on the course outline and lesson content, here's the answer."
            )

            # Verify both tools were executed in sequence
            assert mock_tool_manager.execute_tool.call_count == 2
            mock_tool_manager.execute_tool.assert_any_call(
                "get_course_outline", course_name="Test Course"
            )
            mock_tool_manager.execute_tool.assert_any_call(
                "search_course_content", query="lesson 4 content"
            )

            # Verify 3 API calls were made (round1 + round2 + final)
            assert mock_client.messages.create.call_count == 3

    def test_sequential_tool_calling_early_termination(self, mock_tool_manager):
        """Test that sequential tool calling terminates early when AI doesn't use tools"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.return_value = mock_client

            # Round 1: AI makes tool call
            round1_response = Mock()
            round1_response.stop_reason = "tool_use"
            round1_response.content = [Mock()]
            round1_response.content[0].type = "tool_use"
            round1_response.content[0].name = "search_course_content"
            round1_response.content[0].id = "tool_1"
            round1_response.content[0].input = {"query": "test query"}

            # Round 2: AI provides direct answer without tool use
            round2_response = Mock()
            round2_response.stop_reason = "stop"
            round2_response.content = [Mock()]
            round2_response.content[0].text = (
                "Here's the direct answer based on the search results."
            )

            mock_client.messages.create.side_effect = [round1_response, round2_response]

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            # Execute
            response = generator.generate_response(
                "What is in the course?",
                tools=mock_tool_manager.get_tool_definitions(),
                tool_manager=mock_tool_manager,
            )

            # Assert
            assert response == "Here's the direct answer based on the search results."

            # Verify only one tool was executed
            assert mock_tool_manager.execute_tool.call_count == 1
            mock_tool_manager.execute_tool.assert_called_with(
                "search_course_content", query="test query"
            )

            # Verify only 2 API calls were made (round1 + round2 with direct response)
            assert mock_client.messages.create.call_count == 2

    def test_sequential_tool_calling_tool_failure_stops_rounds(self, mock_tool_manager):
        """Test that tool execution failure stops sequential rounds"""
        with patch("ai_generator.anthropic.Anthropic") as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.return_value = mock_client

            # Round 1: AI makes tool call that fails
            round1_response = Mock()
            round1_response.stop_reason = "tool_use"
            round1_response.content = [Mock()]
            round1_response.content[0].type = "tool_use"
            round1_response.content[0].name = "search_course_content"
            round1_response.content[0].id = "tool_1"
            round1_response.content[0].input = {"query": "test query"}

            # Final response after tool failure
            final_response = Mock()
            final_response.content = [Mock()]
            final_response.content[0].text = "I encountered an error while searching."

            # Make tool execution fail
            mock_tool_manager.execute_tool.side_effect = Exception("Tool failed")

            mock_client.messages.create.side_effect = [round1_response, final_response]

            generator = AIGenerator("test-api-key", "claude-sonnet-4-20250514")

            # Execute
            response = generator.generate_response(
                "Search for something",
                tools=mock_tool_manager.get_tool_definitions(),
                tool_manager=mock_tool_manager,
            )

            # Assert
            assert response == "I encountered an error while searching."

            # Verify tool was attempted once
            assert mock_tool_manager.execute_tool.call_count == 1

            # Verify 2 API calls were made (round1 + final after failure)
            assert mock_client.messages.create.call_count == 2

            # Verify error was passed to Claude in tool result
            final_call_args = mock_client.messages.create.call_args_list[1][1]
            tool_result_message = final_call_args["messages"][-1]
            assert tool_result_message["role"] == "user"
            assert (
                "Error: Tool execution failed"
                in tool_result_message["content"][0]["content"]
            )
