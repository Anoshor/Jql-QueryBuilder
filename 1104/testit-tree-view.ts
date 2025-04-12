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

  // Initialize with all project nodes expanded for better UX
  useEffect(() => {
    if (testItData && testItData.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      testItData.forEach(project => {
        initialExpanded[project['Project ID']] = true;
      });
      setExpandedNodes(initialExpanded);
    }
  }, [testItData]);

  // Add debug logging to inspect the data structure
  useEffect(() => {
    console.log("TestItTreeView: Data received", testItData?.length || 0, "projects");
    if (testItData && testItData.length > 0) {
      const firstProject = testItData[0];
      console.log("First project structure:", firstProject['Project Name']);
      if (firstProject['Test Suites'] && firstProject['Test Suites'].length > 0) {
        console.log("Test suites count:", firstProject['Test Suites'].length);
        const firstSuite = firstProject['Test Suites'][0];
        console.log("First suite has Suites?", !!firstSuite.Suites, 
                    "Count:", firstSuite.Suites?.length || 0);
      }
    }
  }, [testItData]);

  // Set filtered projects whenever testItData changes
  useEffect(() => {
    if (testItData) {
      setFilteredProjects(testItData);
    }
  }, [testItData]);

  // Filter projects and suites based on search text
  useEffect(() => {
    if (!searchText || !testItData) {
      setFilteredProjects(testItData || []);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = testItData.filter(project => {
      if (!project) return false;
      
      // Check if project name matches
      if (project['Project Name']?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Check if any suite name matches
      return hasMatchingSuite(project, searchLower);
    });

    setFilteredProjects(filtered);
  }, [searchText, testItData]);

  // Helper to check if a project has any suite matching the search term
  const hasMatchingSuite = (project: TestItProject, searchText: string): boolean => {
    if (!project['Test Suites']) return false;
    
    // Check each test suite wrapper
    for (const suiteWrapper of project['Test Suites']) {
      // Check if the wrapper itself is a suite that matches
      if (suiteWrapper['Suite Name']?.toLowerCase().includes(searchText)) {
        return true;
      }
      
      // Check suites inside the wrapper
      if (suiteWrapper.Suites) {
        if (checkSuiteArrayMatches(suiteWrapper.Suites, searchText)) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Helper function to check if any suite in array matches search
  const checkSuiteArrayMatches = (suites: Suite[], searchText: string): boolean => {
    if (!suites) return false;
    
    for (const suite of suites) {
      if (!suite) continue;
      
      // Check if current suite matches
      if (suite['Suite Name']?.toLowerCase().includes(searchText)) {
        return true;
      }
      
      // Check child suites recursively
      if (suite.Child_Suites && suite.Child_Suites.length > 0) {
        if (checkSuiteArrayMatches(suite.Child_Suites, searchText)) {
          return true;
        }
      }
      
      // Also check if there's a nested "Suites" array
      if (suite.Suites && suite.Suites.length > 0) {
        if (checkSuiteArrayMatches(suite.Suites as Suite[], searchText)) {
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
    console.log("Toggling node:", nodeId);
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
    console.log("Toggled path:", path);
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

  // Get all root-level suites for a project
  const getProjectSuites = (project: TestItProject): Suite[] => {
    if (!project || !project['Test Suites'] || project['Test Suites'].length === 0) {
      return [];
    }
    
    const rootSuites: Suite[] = [];
    
    // Process each test suite wrapper
    for (const wrapper of project['Test Suites']) {
      if (!wrapper) continue;
      
      // If the wrapper itself is a suite, add it
      if (wrapper.Suite_Id && wrapper['Suite Name']) {
        rootSuites.push(wrapper as unknown as Suite);
      }
      // If wrapper has a Suites array, add all suites from it
      else if (wrapper.Suites && wrapper.Suites.length > 0) {
        rootSuites.push(...wrapper.Suites);
      }
    }
    
    return rootSuites;
  };

  // Helper function to get all children of a suite (from both Child_Suites and Suites)
  const getChildSuites = (suite: Suite): Suite[] => {
    const children: Suite[] = [];
    
    // Add from Child_Suites if present
    if (suite.Child_Suites && suite.Child_Suites.length > 0) {
      children.push(...suite.Child_Suites);
    }
    
    // Add from Suites if present (need to cast as Suite[] since it might be a different type)
    if ((suite as any).Suites && (suite as any).Suites.length > 0) {
      children.push(...((suite as any).Suites as Suite[]));
    }
    
    return children;
  };

  // Recursive function to render suites and their children
  const renderSuite = (suite: Suite, projectId: string, parentPath: string = ''): React.ReactNode => {
    if (!suite || !suite.Suite_Id) return null;
    
    const currentPath = parentPath ? `${parentPath}:${suite.Suite_Id}` : `${projectId}:${suite.Suite_Id}`;
    const childSuites = getChildSuites(suite);
    const hasChildren = childSuites.length > 0;
    const isExpanded = expandedNodes[currentPath] || false;
    
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
            {(suite.Total_Test_Cases || 0) > 0 && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({suite.Total_Test_Cases} tests)
              </Typography>
            )}
          </Typography>
        </Box>
        
        {hasChildren && (
          <Collapse in={isExpanded}>
            {childSuites.map(childSuite => 
              renderSuite(childSuite, projectId, currentPath)
            )}
          </Collapse>
        )}
      </Box>
    );
  };

  // Find a suite by its ID in the project
  const findSuiteById = (project: TestItProject, suiteId: string): Suite | null => {
    if (!project || !project['Test Suites']) return null;
    
    // Helper function to search for suite recursively
    const searchInSuites = (suites: Suite[]): Suite | null => {
      if (!suites) return null;
      
      for (const suite of suites) {
        if (!suite) continue;
        
        if (suite.Suite_Id === suiteId) {
          return suite;
        }
        
        // Check in Child_Suites
        if (suite.Child_Suites && suite.Child_Suites.length > 0) {
          const found = searchInSuites(suite.Child_Suites);
          if (found) return found;
        }
        
        // Check in Suites
        if ((suite as any).Suites && (suite as any).Suites.length > 0) {
          const found = searchInSuites((suite as any).Suites);
          if (found) return found;
        }
      }
      
      return null;
    };
    
    // Search in all test suite wrappers
    for (const wrapper of project['Test Suites']) {
      // Check if wrapper itself is a suite
      if (wrapper.Suite_Id === suiteId) {
        return wrapper as unknown as Suite;
      }
      
      // Check in wrapper's Suites
      if (wrapper.Suites && wrapper.Suites.length > 0) {
        const found = searchInSuites(wrapper.Suites);
        if (found) return found;
      }
    }
    
    return null;
  };

  // Convert a path to a human-readable string
  const getPathDisplayName = (path: string): string => {
    const pathParts = path.split(':');
    const projectId = pathParts[0];
    const project = testItData?.find(p => p['Project ID'] === projectId);
    
    if (!project) return path;
    
    let displayName = project['Project Name'];
    
    // For each part of the path after projectId, find the suite and append its name
    for (let i = 1; i < pathParts.length; i++) {
      const suiteId = pathParts[i];
      const suite = findSuiteById(project, suiteId);
      
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
        {!filteredProjects || filteredProjects.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {!testItData || testItData.length === 0 ? 'Loading TestIt data...' : 'No matching projects found'}
          </Typography>
        ) : (
          filteredProjects.map(project => {
            if (!project) return null;
            
            const projectId = project['Project ID'];
            const isExpanded = expandedNodes[projectId] || false;
            const rootSuites = getProjectSuites(project);
            
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
                    {rootSuites.length > 0 && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({rootSuites.length} suites)
                      </Typography>
                    )}
                  </Typography>
                </Box>
                
                <Collapse in={isExpanded}>
                  {rootSuites.length > 0 ? (
                    rootSuites.map(suite => renderSuite(suite, projectId))
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
    </Box>
  );
};

export default TestItTreeView;
