import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Checkbox,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { TestItProject, Suite } from './types';

interface TestItTreeViewProps {
  testItData: TestItProject[];
  selectedPaths: string[];
  onPathsChange: (paths: string[]) => void;
}

const TestItTreeView: React.FC<TestItTreeViewProps> = ({
  testItData,
  selectedPaths,
  onPathsChange
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [searchText, setSearchText] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<TestItProject[]>([]);

  // Filter projects and suites based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredProjects(testItData);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = testItData.filter(project => {
      // Check if project name matches
      if (project['Project Name'].toLowerCase().includes(searchLower)) {
        return true;
      }

      // Check if any suite name matches
      const suites = project['Test Suites'][0]?.Suites || [];
      return checkSuiteMatches(suites, searchLower);
    });

    setFilteredProjects(filtered);
  }, [searchText, testItData]);

  // Helper function to check if any suite or child suite matches the search
  const checkSuiteMatches = (suites: Suite[], searchText: string): boolean => {
    for (const suite of suites) {
      if (suite['Suite Name'].toLowerCase().includes(searchText)) {
        return true;
      }
      
      if (suite.Child_Suites && suite.Child_Suites.length > 0) {
        if (checkSuiteMatches(suite.Child_Suites, searchText)) {
          return true;
        }
      }
    }
    return false;
  };

  // Toggle expanded state for a node
  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Check if a path is selected
  const isPathSelected = (path: string) => selectedPaths.includes(path);

  // Toggle selection for a path
  const togglePath = (path: string) => {
    if (isPathSelected(path)) {
      onPathsChange(selectedPaths.filter(p => p !== path));
    } else {
      onPathsChange([...selectedPaths, path]);
    }
  };

  // Render a suite node and its children recursively
  const renderSuites = (suites: Suite[], projectId: string, parentPath: string = '') => {
    return suites.map(suite => {
      const currentPath = parentPath ? `${parentPath}:${suite.Suite_Id}` : `${projectId}:${suite.Suite_Id}`;
      const hasChildren = suite.Child_Suites && suite.Child_Suites.length > 0;
      const isExpanded = expandedNodes[currentPath] || false;
      
      return (
        <Box key={currentPath} sx={{ ml: parentPath ? 4 : 2, my: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {hasChildren && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(currentPath);
                }}
              >
                {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
              </IconButton>
            )}
            {!hasChildren && <Box sx={{ width: 28 }} />}
            
            <Checkbox
              checked={isPathSelected(currentPath)}
              onChange={() => togglePath(currentPath)}
              size="small"
            />
            
            <Typography 
              variant="body2" 
              onClick={() => toggleExpand(currentPath)}
              sx={{ 
                cursor: 'pointer',
                fontWeight: isPathSelected(currentPath) ? 'bold' : 'normal',
                '&:hover': { textDecoration: 'underline' } 
              }}
            >
              {suite['Suite Name']}
            </Typography>
          </Box>
          
          {hasChildren && (
            <Collapse in={isExpanded}>
              {renderSuites(suite.Child_Suites || [], projectId, currentPath)}
            </Collapse>
          )}
        </Box>
      );
    });
  };

  return (
    <Box>
      {/* Search Box */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search projects and suites..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchText && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchText('')}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Selected Paths Display */}
      {selectedPaths.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" gutterBottom>
            Selected Paths ({selectedPaths.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedPaths.map(path => {
              // Try to display a human-readable name for the path
              const pathParts = path.split(':');
              const projectId = pathParts[0];
              const project = testItData.find(p => p['Project ID'] === projectId);
              let displayName = path;
              
              if (project) {
                displayName = `${project['Project Name']} - `;
                // Extract suite names from the path
                let currentSuites = project['Test Suites'][0]?.Suites || [];
                for (let i = 1; i < pathParts.length; i++) {
                  const suiteId = pathParts[i];
                  const suite = currentSuites.find(s => s.Suite_Id === suiteId);
                  if (suite) {
                    displayName += (i > 1 ? ' > ' : '') + suite['Suite Name'];
                    currentSuites = suite.Child_Suites || [];
                  } else {
                    displayName += (i > 1 ? ' > ' : '') + suiteId;
                    break;
                  }
                }
              }
              
              return (
                <Chip
                  key={path}
                  label={displayName}
                  onDelete={() => togglePath(path)}
                  size="small"
                  color="primary"
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* Tree View */}
      <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
        {filteredProjects.map(project => {
          const projectId = project['Project ID'];
          const isExpanded = expandedNodes[projectId] || false;
          const projectSuites = project['Test Suites'][0]?.Suites || [];
          
          return (
            <Box key={projectId} sx={{ mb: 1 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 1, 
                  borderRadius: 1,
                  bgcolor: 'rgba(0, 0, 0, 0.04)'
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(projectId);
                  }}
                >
                  {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                </IconButton>
                
                <Typography 
                  variant="subtitle2" 
                  onClick={() => toggleExpand(projectId)}
                  sx={{ cursor: 'pointer', flexGrow: 1 }}
                >
                  {project['Project Name']}
                </Typography>
              </Box>
              
              <Collapse in={isExpanded}>
                {renderSuites(projectSuites, projectId)}
              </Collapse>
            </Box>
          );
        })}
      </Paper>
    </Box>
  );
};

export default TestItTreeView;