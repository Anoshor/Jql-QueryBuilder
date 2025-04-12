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

  useEffect(() => {
    console.log("TestIt data:", testItData);
  }, [testItData]);

  // Initialize with all project nodes expanded for better UX
  useEffect(() => {
    if (testItData.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      testItData.forEach(project => {
        initialExpanded[project['Project ID']] = true;
      });
      setExpandedNodes(initialExpanded);
    }
  }, [testItData]);

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
      const suites = getAllSuitesForProject(project);
      return suites.some(suite => suite['Suite Name']?.toLowerCase().includes(searchLower));
    });

    setFilteredProjects(filtered);
  }, [searchText, testItData]);

  // Helper function to check if any suite in an array matches the search text
  const checkSuiteMatches = (suites: Suite[], searchText: string): boolean => {
    for (const suite of suites) {
      if (!suite) continue;
      
      if (suite['Suite Name']?.toLowerCase().includes(searchText)) {
        return true;
      }
      
      // Check both Suites and Child_Suites for children
      const childSuites = suite.Child_Suites || suite.Suites as Suite[] || [];
      if (childSuites.length > 0) {
        if (checkSuiteMatches(childSuites, searchText)) {
          return true;
        }
      }
    }
    return false;
  };

  // Toggle expanded state for a node
  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
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

  // Auto-expand parent nodes when a child is selected
  useEffect(() => {
    if (selectedPaths.length > 0) {
      const newExpandedNodes = { ...expandedNodes };
      
      selectedPaths.forEach(path => {
        const parts = path.split(':');
        // Always expand the project
        newExpandedNodes[parts[0]] = true;
        
        // For each level in the path, expand the parent
        let currentPath = parts[0];
        for (let i = 1; i < parts.length; i++) {
          currentPath += `:${parts[i]}`;
          newExpandedNodes[currentPath] = true;
        }
      });
      
      setExpandedNodes(newExpandedNodes);
    }
  }, [selectedPaths]);

  // Get all the suites for a project (flattened)
  const getAllSuitesForProject = (project: TestItProject): Suite[] => {
    const result: Suite[] = [];
    
    if (!project['Test Suites']) return result;
    
    // Function to recursively extract all suites
    const extractSuites = (suite: any) => {
      if (!suite) return;
      
      if (suite.Suite_Id) {
        result.push(suite);
      }
      
      // Check both Suites and Child_Suites properties
      const childSuites1 = suite.Suites as Suite[] || [];
      const childSuites2 = suite.Child_Suites as Suite[] || [];
      
      [...childSuites1, ...childSuites2].forEach(extractSuites);
    };
    
    // Start with the root test suites
    project['Test Suites'].forEach(extractSuites);
    
    return result;
  };

  // Get all root-level suites for a project
  const getProjectSuites = (project: TestItProject): Suite[] => {
    if (!project['Test Suites'] || project['Test Suites'].length === 0) {
      return [];
    }
    
    const result: Suite[] = [];
    
    // Each project has Test Suites which contains our starting level
    for (const suiteContainer of project['Test Suites']) {
      // First check if the container itself is a suite
      if (suiteContainer.Suite_Id) {
        result.push(suiteContainer as any as Suite);
      }
      // Then check if it has a Suites array
      else if (suiteContainer.Suites && suiteContainer.Suites.length > 0) {
        result.push(...suiteContainer.Suites);
      }
    }
    
    return result;
  };

  // Recursive function to render suites and all potential children
  const renderSuites = (suites: Suite[], projectId: string, parentPath: string = '') => {
    return suites.map(suite => {
      if (!suite || !suite.Suite_Id) return null;
      
      const currentPath = parentPath ? `${parentPath}:${suite.Suite_Id}` : `${projectId}:${suite.Suite_Id}`;
      
      // Check for children in both Child_Suites and Suites
      const childSuites1 = suite.Child_Suites || [];
      const childSuites2 = (suite as any).Suites || []; 
      const allChildSuites = [...childSuites1, ...childSuites2];
      const hasChildren = allChildSuites.length > 0;
      
      const isExpanded = expandedNodes[currentPath] || false;
      const totalTests = suite.Total_Test_Cases || suite.totalTestCases || 0;
      
      return (
        <Box key={currentPath} sx={{ ml: parentPath ? 4 : 2, my: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={(e) => toggleExpand(currentPath, e)}
              >
                {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
              </IconButton>
            ) : (
              <Box sx={{ width: 28 }} />
            )}
            
            <Checkbox
              checked={isPathSelected(currentPath)}
              onChange={() => togglePath(currentPath)}
              onClick={(e) => e.stopPropagation()}
              size="small"
            />
            
            <Typography 
              variant="body2" 
              onClick={(e) => {
                if (hasChildren) toggleExpand(currentPath, e);
              }}
              sx={{ 
                cursor: hasChildren ? 'pointer' : 'default',
                fontWeight: isPathSelected(currentPath) ? 'bold' : 'normal',
                '&:hover': hasChildren ? { textDecoration: 'underline' } : {}
              }}
            >
              {suite['Suite Name']}
              {totalTests > 0 && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ({totalTests} tests)
                </Typography>
              )}
            </Typography>
          </Box>
          
          {hasChildren && (
            <Collapse in={isExpanded}>
              {renderSuites(allChildSuites, projectId, currentPath)}
            </Collapse>
          )}
        </Box>
      );
    });
  };

  // Convert a path to a human-readable string
  const getPathDisplayName = (path: string): string => {
    const pathParts = path.split(':');
    const projectId = pathParts[0];
    const project = testItData.find(p => p['Project ID'] === projectId);
    
    if (!project) return path;
    
    let displayName = project['Project Name'];
    
    // Get all suites for this project to search through
    const allSuites = getAllSuitesForProject(project);
    
    // For each part of the path (after the project ID), find the corresponding suite
    for (let i = 1; i < pathParts.length; i++) {
      const suiteId = pathParts[i];
      const suite = allSuites.find(s => s.Suite_Id === suiteId);
      
      if (suite) {
        displayName += ` > ${suite['Suite Name']}`;
      } else {
        displayName += ` > ${suiteId}`;
      }
    }
    
    return displayName;
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
            {selectedPaths.map(path => (
              <Chip
                key={path}
                label={getPathDisplayName(path)}
                onDelete={() => togglePath(path)}
                size="small"
                color="primary"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Tree View */}
      <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
        {filteredProjects.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {testItData.length === 0 ? 'Loading TestIt data...' : 'No matching projects found'}
          </Typography>
        ) : (
          filteredProjects.map(project => {
            const projectId = project['Project ID'];
            const isExpanded = expandedNodes[projectId] || false;
            const projectSuites = getProjectSuites(project);
            
            return (
              <Box key={projectId} sx={{ mb: 1 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 1, 
                    borderRadius: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => toggleExpand(projectId, e)}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => toggleExpand(projectId, e)}
                  >
                    {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                  </IconButton>
                  
                  <Typography 
                    variant="subtitle2" 
                    sx={{ flexGrow: 1 }}
                  >
                    {project['Project Name']}
                    {projectSuites.length > 0 && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({projectSuites.length} suites)
                      </Typography>
                    )}
                  </Typography>
                </Box>
                
                <Collapse in={isExpanded}>
                  {projectSuites.length > 0 ? (
                    renderSuites(projectSuites, projectId)
                  ) : (
                    <Box sx={{ ml: 4, mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        No test suites available
                      </Typography>
                    </Box>
                  )}
                </Collapse>
              </Box>
            );
          })
        )}
      </Paper>

      {/* Debug output when needed */}
      {false && (
        <Box sx={{ mt: 2, border: "1px solid #eee", p: 2, bgcolor: "#f9f9f9" }}>
          <Typography variant="subtitle2">Debug Info:</Typography>
          <pre style={{ fontSize: '12px' }}>
            Projects: {testItData.length}<br />
            Selected paths: {JSON.stringify(selectedPaths, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
};

export default TestItTreeView;