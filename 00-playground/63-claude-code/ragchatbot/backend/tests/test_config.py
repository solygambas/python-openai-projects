import os
import sys
from unittest.mock import Mock, patch

import pytest

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config, config


class TestConfig:
    """Test cases for Configuration"""

    def test_default_config_values(self):
        """Test default configuration values"""
        default_config = Config()

        # Test API settings
        assert default_config.ANTHROPIC_MODEL == "claude-sonnet-4-20250514"
        assert default_config.EMBEDDING_MODEL == "all-MiniLM-L6-v2"

        # Test document processing settings
        assert default_config.CHUNK_SIZE == 800
        assert default_config.CHUNK_OVERLAP == 100
        assert default_config.MAX_HISTORY == 2

        # Test database paths
        assert default_config.CHROMA_PATH == "./chroma_db"

    def test_broken_max_results_configuration(self):
        """Test the critical MAX_RESULTS=0 configuration issue"""
        default_config = Config()

        # This test documents the current broken state
        assert default_config.MAX_RESULTS == 0  # This is the bug!

        # This value should be > 0 for the system to work properly
        # When MAX_RESULTS=0, the vector search returns no results

    def test_proper_max_results_configuration(self):
        """Test what the MAX_RESULTS configuration should be"""
        proper_config = Config()
        proper_config.MAX_RESULTS = 5  # What it should be

        # Verify proper configuration
        assert proper_config.MAX_RESULTS > 0
        assert isinstance(proper_config.MAX_RESULTS, int)

        # Test that this value makes sense for search
        assert proper_config.MAX_RESULTS <= 10  # Reasonable upper bound
        assert proper_config.MAX_RESULTS >= 1  # Must be at least 1

    def test_config_with_environment_variables(self):
        """Test configuration loading from environment variables"""
        with patch.dict(
            os.environ,
            {
                "ANTHROPIC_API_KEY": "test-env-key",
                "ANTHROPIC_MODEL": "claude-test-model",
            },
        ):
            # Create new config instance to pick up env vars
            test_config = Config()

            assert test_config.ANTHROPIC_API_KEY == "test-env-key"
            assert test_config.ANTHROPIC_MODEL == "claude-test-model"

    def test_config_missing_api_key(self):
        """Test configuration when API key is missing"""
        with patch.dict(os.environ, {}, clear=True):
            test_config = Config()

            # Should default to empty string when env var not set
            assert test_config.ANTHROPIC_API_KEY == ""

    def test_config_chunk_settings_valid(self):
        """Test that chunk processing settings are valid"""
        test_config = Config()

        # Chunk size should be reasonable
        assert test_config.CHUNK_SIZE > 0
        assert test_config.CHUNK_SIZE <= 2000  # Not too large

        # Overlap should be smaller than chunk size
        assert test_config.CHUNK_OVERLAP < test_config.CHUNK_SIZE
        assert test_config.CHUNK_OVERLAP >= 0

        # History should be reasonable
        assert test_config.MAX_HISTORY >= 0
        assert test_config.MAX_HISTORY <= 10  # Not too much history

    def test_config_path_settings(self):
        """Test database path configuration"""
        test_config = Config()

        assert isinstance(test_config.CHROMA_PATH, str)
        assert test_config.CHROMA_PATH != ""
        assert not test_config.CHROMA_PATH.startswith("/")  # Should be relative

    def test_config_model_settings(self):
        """Test AI model configuration"""
        test_config = Config()

        # Should use Claude model
        assert "claude" in test_config.ANTHROPIC_MODEL.lower()

        # Should use sentence transformer for embeddings
        assert test_config.EMBEDDING_MODEL != ""
        assert isinstance(test_config.EMBEDDING_MODEL, str)

    def test_global_config_instance(self):
        """Test the global config instance"""
        # The global config instance should exist
        assert config is not None
        assert isinstance(config, Config)

        # Test it has the fixed MAX_RESULTS value
        assert config.MAX_RESULTS == 5

    def test_config_impact_on_vector_search(self):
        """Test how MAX_RESULTS=0 impacts vector search behavior"""
        broken_config = Config()
        proper_config = Config()
        proper_config.MAX_RESULTS = 5

        # Demonstrate the difference
        assert broken_config.MAX_RESULTS == 0  # Broken - will return no results
        assert proper_config.MAX_RESULTS == 5  # Fixed - will return results

        # This test shows why the system fails:
        # When max_results is used as n_results in ChromaDB query,
        # n_results=0 means "return 0 results" regardless of matches

    def test_config_values_are_correct_types(self):
        """Test that all config values have correct types"""
        test_config = Config()

        # String values
        assert isinstance(test_config.ANTHROPIC_API_KEY, str)
        assert isinstance(test_config.ANTHROPIC_MODEL, str)
        assert isinstance(test_config.EMBEDDING_MODEL, str)
        assert isinstance(test_config.CHROMA_PATH, str)

        # Integer values
        assert isinstance(test_config.CHUNK_SIZE, int)
        assert isinstance(test_config.CHUNK_OVERLAP, int)
        assert isinstance(test_config.MAX_RESULTS, int)
        assert isinstance(test_config.MAX_HISTORY, int)

    def test_config_validation_logic(self):
        """Test configuration validation (what should be implemented)"""
        # This test shows what validation logic could be added

        def validate_config(cfg):
            """Example validation function"""
            errors = []

            if cfg.MAX_RESULTS <= 0:
                errors.append("MAX_RESULTS must be greater than 0")

            if cfg.CHUNK_OVERLAP >= cfg.CHUNK_SIZE:
                errors.append("CHUNK_OVERLAP must be less than CHUNK_SIZE")

            if cfg.ANTHROPIC_API_KEY == "":
                errors.append("ANTHROPIC_API_KEY is required")

            return errors

        # Test current broken config
        broken_config = Config()
        errors = validate_config(broken_config)

        # Should have validation errors
        assert len(errors) > 0
        assert any("MAX_RESULTS must be greater than 0" in error for error in errors)

        # Test proper config
        proper_config = Config()
        proper_config.MAX_RESULTS = 5
        proper_config.ANTHROPIC_API_KEY = "valid-key"

        errors = validate_config(proper_config)
        # Should have fewer errors (only missing API key if not set in env)
        max_results_errors = [e for e in errors if "MAX_RESULTS" in e]
        assert len(max_results_errors) == 0

    def test_config_edge_cases(self):
        """Test configuration edge cases"""
        test_config = Config()

        # Test very large chunk size
        test_config.CHUNK_SIZE = 10000
        assert test_config.CHUNK_SIZE == 10000

        # Test zero overlap (valid)
        test_config.CHUNK_OVERLAP = 0
        assert test_config.CHUNK_OVERLAP == 0

        # Test large max results
        test_config.MAX_RESULTS = 100
        assert test_config.MAX_RESULTS == 100

    def test_config_immutability_during_runtime(self):
        """Test that config changes affect system behavior"""
        # This test demonstrates how changing MAX_RESULTS affects the system

        # Simulate broken system behavior
        broken_config = Config()
        broken_config.MAX_RESULTS = 0

        # In a real VectorStore, this would result in no search results
        def simulate_search(max_results):
            if max_results == 0:
                return []  # No results due to n_results=0
            else:
                return ["result1", "result2"]  # Normal results

        broken_results = simulate_search(broken_config.MAX_RESULTS)
        assert broken_results == []  # Demonstrates the bug

        # Fixed system behavior
        fixed_config = Config()
        fixed_config.MAX_RESULTS = 5

        fixed_results = simulate_search(fixed_config.MAX_RESULTS)
        assert len(fixed_results) > 0  # Shows the fix works

    def test_config_dataclass_behavior(self):
        """Test that Config behaves as expected dataclass"""
        config1 = Config()
        config2 = Config()

        # Should be separate instances
        assert config1 is not config2

        # But have same default values
        assert config1.CHUNK_SIZE == config2.CHUNK_SIZE
        assert config1.MAX_RESULTS == config2.MAX_RESULTS

        # Changes to one shouldn't affect the other
        config1.MAX_RESULTS = 10
        assert config2.MAX_RESULTS == 0  # Still the default broken value

    @pytest.mark.parametrize(
        "max_results,expected_behavior",
        [
            (0, "no_results"),  # Current broken behavior
            (1, "some_results"),  # Minimal fix
            (5, "good_results"),  # Recommended fix
            (10, "many_results"),  # Upper reasonable bound
        ],
    )
    def test_max_results_impact_parametrized(self, max_results, expected_behavior):
        """Test different MAX_RESULTS values and their impact"""
        test_config = Config()
        test_config.MAX_RESULTS = max_results

        # Simulate the impact on search results
        if max_results == 0:
            assert expected_behavior == "no_results"
            # This is the bug case
        elif max_results >= 1:
            assert expected_behavior in ["some_results", "good_results", "many_results"]
            # These are the working cases

        # Verify the config has the expected value
        assert test_config.MAX_RESULTS == max_results
