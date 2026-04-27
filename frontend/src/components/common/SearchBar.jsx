import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Package, Tag, Clock } from 'lucide-react';
import apiService from '../../services/api';

const SearchBar = ({
  placeholder = "Search products or categories...",
  className = "",
  onSearch,
  showSuggestions = true,
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);

  const navigate = useNavigate();
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing recent searches:', error);
      }
    }
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          setIsLoading(true);
          const response = await apiService.getSearchSuggestions(query);
          if (response.success) {
            setSuggestions(response.data.suggestions || []);
            setShowSuggestionsDropdown(true);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestionsDropdown(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestionsDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestionsDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestionsDropdown(false);
    setSelectedIndex(-1);

    // Add to recent searches
    addToRecentSearches(suggestion.text);

    // Handle navigation based on suggestion type
    if (suggestion.type === 'product') {
      navigate(`/category?productId=${suggestion.id}`);
    } else if (suggestion.type === 'category') {
      navigate(`/category?categoryId=${suggestion.id}`);
    } else {
      // For tags or general search
      navigate(`/category?tag=${encodeURIComponent(suggestion.text)}`);
    }
  };

  // Handle search submission
  const handleSearch = async () => {
    if (!query.trim()) return;

    setShowSuggestionsDropdown(false);
    setSelectedIndex(-1);

    // Add to recent searches
    addToRecentSearches(query.trim());

    try {
      // Try to get specific redirect first
      const redirectResponse = await apiService.handleSearchRedirect(query.trim());

      if (redirectResponse.success && redirectResponse.data.redirectUrl) {
        navigate(redirectResponse.data.redirectUrl);
      } else {
        // Fallback to general search
        navigate(`/category?tag=${encodeURIComponent(query.trim())}`);
      }
    } catch (error) {
      console.error('Search redirect error:', error);
      // Fallback to general search
      navigate(`/category?tag=${encodeURIComponent(query.trim())}`);
    }

    // Call custom onSearch callback if provided
    if (onSearch) {
      onSearch(query.trim());
    }
  };

  // Add to recent searches
  const addToRecentSearches = (searchTerm) => {
    const updated = [searchTerm, ...recentSearches.filter(term => term !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestionsDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Get suggestion icon
  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'product':
        return <Package size={16} className="text-blue-500" />;
      case 'category':
        return <Tag size={16} className="text-green-500" />;
      case 'tag':
        return <Tag size={16} className="text-purple-500" />;
      default:
        return <Search size={16} className="text-gray-500" />;
    }
  };

  // Show recent searches when focused and no query
  const handleFocus = () => {
    if (!query.trim() && recentSearches.length > 0) {
      setShowSuggestionsDropdown(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding to allow clicking on suggestions
    setTimeout(() => {
      setShowSuggestionsDropdown(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-4 py-2.5 pl-12 pr-4 border-2 border-gray-900 rounded-4xl focus:outline-none focus:border-[#23e5db] transition-all text-sm"
        />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X size={16} className="text-gray-600" />
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-80 overflow-y-auto search-suggestions"
        >
          {/* Loading indicator */}
          {isLoading && (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {/* Recent Searches */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Clock size={12} />
                Recent Searches
              </div>
              {recentSearches.map((term, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(term);
                    handleSearch();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                >
                  <Clock size={16} className="text-gray-400" />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Suggestions */}
          {query.trim() && suggestions.length > 0 && (
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id || suggestion.text}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left transition-colors ${selectedIndex === index ? 'bg-blue-50' : ''
                    }`}
                >
                  {suggestion.image ? (
                    <img
                      src={suggestion.image}
                      alt={suggestion.text}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    getSuggestionIcon(suggestion.type)
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.text}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-xs text-gray-500 truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {suggestion.type}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No suggestions */}
          {query.trim() && !isLoading && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Search size={24} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No suggestions found</p>
              <p className="text-xs text-gray-400 mt-1">Press Enter to search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
