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
import { TestItProject } from './types';

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

  // Initialize project nodes as expanded
  useEffect(() => {
    if (testItData && testItData.length > 0) {
      const initial: Record<string, boolean> = {};
      testItData.forEach(project => {
        initial[project['Project ID']] = true;
      });
      setExpandedNodes(initial);
    }
  }, [testItData]);

  const toggleExpanded = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const toggleSelection = (path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isSelected = selectedPaths.includes(path);
    if (isSelected) {
      onPathsChange(selectedPaths.filter(p => p !== path));
    } else {
      onPathsChange([...selectedPaths, path]);
    }
  };

  // Filter projects by search text
  const filteredProjects = searchText 
    ? testItData.filter(p => p['Project Name'].toLowerCase().includes(searchText.toLowerCase()))
    : testItData;

  // Recursive function to render a suite and its children
  const renderSuite = (
    suite: any, 
    projectId: string, 
    parentPath: string = '', 
    level: number = 0
  ) => {
    if (!suite || !suite.Suite_Id) return null;
    
    const path = parentPath 
      ? `${parentPath}:${suite.Suite_Id}` 
      : `${projectId}:${suite.Suite_Id}`;
    
    const isSelected = selectedPaths.includes(path);
    const isExpanded = !!expandedNodes[path];
    
    // Get all possible children (from Child_Suites or Suites)
    const children = [
      ...(suite.Child_Suites || []),
      ...(suite.Suites || [])
    ].filter(Boolean);
    
    const hasChildren = children.length > 0;
    
    return (
      <Box key={path}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            pl: level * 3 + 2,
            py: 0.5, 
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
          }}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={(e) => toggleExpanded(path, e)}
            >
              {isExpanded 
                ? <ExpandMoreIcon fontSize="small" /> 
                : <ChevronRightIcon fontSize="small" />
              }
            </IconButton>
          ) : (
            <Box sx={{ width: 28 }} /> 
          )}
          
          {/* Checkbox */}
          <Checkbox 
            checked={isSelected}
            onChange={(e) => toggleSelection(path)}
            onClick={(e) => e.stopPropagation()}
            size="small"
          />
          
          {/* Suite Name */}
          <Typography 
            variant="body2"
            onClick={() => hasChildren && toggleExpanded(path)}
            sx={{ 
              cursor: hasChildren ? 'pointer' : 'default',
              fontWeight: isSelected ? 'bold' : 'normal'
            }}
          >
            {suite['Suite Name']}
            {suite.Total_Test_Cases > 0 && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({suite.Total_Test_Cases} tests)
              </Typography>
            )}
          </Typography>
        </Box>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <Box>
            {children.map(child => 
              renderSuite(child, projectId, path, level + 1)
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Function to get a readable path name
  const getPathName = (path: string): string => {
    const parts = path.split(':');
    if (parts.length < 2) return path;
    
    const projectId = parts[0];
    const project = testItData.find(p => p['Project ID'] === projectId);
    if (!project) return path;
    
    let result = project['Project Name'];
    
    // For each remaining part, try to find the corresponding suite name
    for (let i = 1; i < parts.length; i++) {
      const suiteId = parts[i];
      let found = false;
      
      // Search function to find a suite by ID
      const findSuite = (suites: any[]): any => {
        if (!suites) return null;
        for (const s of suites) {
          if (!s) continue;
          if (s.Suite_Id === suiteId) return s;
          
          // Look in Child_Suites
          if (s.Child_Suites) {
            const found = findSuite(s.Child_Suites);
            if (found) return found;
          }
          
          // Look in Suites
          if (s.Suites) {
            const found = findSuite(s.Suites);
            if (found) return found;
          }
        }
        return null;
      };
      
      // Start the search from the project's Test Suites
      let suite = null;
      for (const wrapper of project['Test Suites']) {
        // If wrapper is a suite itself
        if (wrapper.Suite_Id === suiteId) {
          suite = wrapper;
          break;
        }
        
        // Look in wrapper's Suites
        if (wrapper.Suites) {
          suite = findSuite(wrapper.Suites);
          if (suite) break;
        }
      }
      
      if (suite) {
        result += ` > ${suite['Suite Name']}`;
        found = true;
      }
      
      if (!found) {
        result += ` > ${suiteId}`;
      }
    }
    
    return result;
  };

  return (
    <Box>
      {/* Search Box */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search projects..."
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

      {/* Selected Paths */}
      {selectedPaths.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" gutterBottom>
            Selected Paths ({selectedPaths.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedPaths.map(path => (
              <Chip
                key={path}
                label={getPathName(path)}
                onDelete={() => toggleSelection(path)}
                size="small"
                color="primary"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Tree View */}
      <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
        {!filteredProjects || filteredProjects.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {!testItData || testItData.length === 0 
              ? 'Loading TestIt data...' 
              : 'No matching projects found'
            }
          </Typography>
        ) : (
          filteredProjects.map(project => {
            if (!project) return null;
            
            const projectId = project['Project ID'];
            const isExpanded = !!expandedNodes[projectId];
            
            return (
              <Box key={projectId} sx={{ mb: 2 }}>
                {/* Project Header */}
                <Box 
                  onClick={() => toggleExpanded(projectId)}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    p: 1,
                    bgcolor: 'rgba(0,0,0,0.04)',
                    borderRadius: 1,
                    cursor: 'pointer'
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => toggleExpanded(projectId, e)}
                  >
                    {isExpanded 
                      ? <ExpandMoreIcon /> 
                      : <ChevronRightIcon />
                    }
                  </IconButton>
                  <Typography variant="subtitle2">
                    {project['Project Name']}
                  </Typography>
                </Box>
                
                {/* Project Suites */}
                {isExpanded && project['Test Suites'] && (
                  <Box sx={{ mt: 1 }}>
                    {project['Test Suites'].map(wrapper => {
                      // If the wrapper is actually a suite
                      if (wrapper.Suite_Id && wrapper['Suite Name']) {
                        return renderSuite(wrapper, projectId);
                      }
                      
                      // If the wrapper contains suites
                      if (wrapper.Suites && wrapper.Suites.length > 0) {
                        return wrapper.Suites.map(suite => 
                          renderSuite(suite, projectId)
                        );
                      }
                      
                      return null;
                    })}
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </Paper>
    </Box>
  );
};

export default TestItTreeView;
