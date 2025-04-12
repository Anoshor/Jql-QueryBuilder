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
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
// Instead of defaultCollapseIcon/defaultExpandIcon, we import the basic SimpleTreeView.
import { SimpleTreeView } from '@mui/x-tree-view';
import { TreeItem } from '@mui/x-tree-view';
import { TestItProject, Suite } from './types';

interface TestItTreeViewProps {
  testItData: TestItProject[];
  selectedPaths: string[];
  onPathsChange: (paths: string[]) => void;
}

/**
 * Helper to return a defined project id.
 * Falls back to the project's "id" property if "Project ID" is missing.
 */
const getProjectId = (project: TestItProject) =>
  project['Project ID'] ? project['Project ID'] : project.id;

/**
 * A multi-level tree for selecting TestIt suites.
 * Each suite is represented by "projectId:suiteId:childSuiteId..."
 */
const TestItTreeView: React.FC<TestItTreeViewProps> = ({
  testItData,
  selectedPaths,
  onPathsChange,
}) => {
  // Which nodes are expanded in the TreeView
  const [expanded, setExpanded] = useState<string[]>([]);
  // For filtering top-level projects by name
  const [searchText, setSearchText] = useState('');

  /**
   * Expand all top-level projects by default (using their IDs).
   */
  useEffect(() => {
    if (testItData && testItData.length > 0) {
      const topLevelIds = testItData.map((p) => getProjectId(p));
      setExpanded(topLevelIds);
    }
  }, [testItData]);

  /**
   * Called by the tree whenever nodes are toggled.
   */
  const handleToggle = (_event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  /**
   * Add or remove a suite path from the array of selectedPaths.
   */
  const toggleSelection = (path: string) => {
    if (selectedPaths.includes(path)) {
      onPathsChange(selectedPaths.filter((p) => p !== path));
    } else {
      onPathsChange([...selectedPaths, path]);
    }
  };

  /**
   * Filter top-level projects by the search text (searching by project name).
   */
  const filteredProjects = searchText
    ? testItData.filter((p) =>
        p['Project Name'].toLowerCase().includes(searchText.toLowerCase())
      )
    : testItData;

  /**
   * Recursively render a suite as a TreeItem (including child suites).
   */
  const renderSuiteItem = (
    suite: Suite,
    projectId: string,
    parentPath: string = ''
  ): React.ReactNode => {
    // Ensure we have a suite and that it has an id
    if (!suite || !suite.Suite_Id) return null;
    
    // Build the "projectId:suiteId" or deeper path.
    const thisPath = parentPath
      ? `${parentPath}:${suite.Suite_Id}`
      : `${projectId}:${suite.Suite_Id}`;
    
    // Combine child arrays—if none exist, children will be an empty array.
    const children = [
      ...(suite.Child_Suites || []),
      ...(suite.Suites || []),
    ].filter(Boolean);
    
    const isSelected = selectedPaths.includes(thisPath);
    
    const label = (
      <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onChange={() => toggleSelection(thisPath)}
          onClick={(e) => e.stopPropagation()}
          size="small"
        />
        
        <Typography variant="body2">
          {suite.Suite_Name}
        </Typography>
        
        {typeof suite.Total_Test_Cases === 'number' && suite.Total_Test_Cases > 0 ? (
          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            ({suite.Total_Test_Cases} tests)
          </Typography>
        ) : null}
      </Box>
    );

    return (
      <TreeItem
        key={suite.Suite_Id}
        nodeId={thisPath}
        label={label}
      >
        {children.map((child) =>
          renderSuiteItem(child, projectId, thisPath)
        )}
      </TreeItem>
    );
  };

  /**
   * Render a top-level project as a TreeItem.
   * Each project's nodeId is obtained from getProjectId().
   */
  const renderProjectItem = (project: TestItProject) => {
    const projectId = getProjectId(project);
    return (
      <TreeItem
        key={projectId}
        nodeId={projectId}
        label={project['Project Name']}
      >
        {project['Test Suites'].map((suite) =>
          renderSuiteItem(suite, projectId)
        )}
      </TreeItem>
    );
  };

  /**
   * Convert a path (e.g. "projectId:suiteId:childSuiteId") to a readable chain.
   */
  const getPathName = (path: string): string => {
    const parts = path.split(':');
    if (parts.length < 1) return path;
    
    const projectId = parts[0];
    const project = testItData.find((p) => getProjectId(p) === projectId);
    if (!project) return path;
    
    let result = project['Project Name'];
    let currentSuites = project['Test Suites'];
    
    for (let i = 1; i < parts.length; i++) {
      const suiteId = parts[i];
      
      // Recursive helper to search suites by Suite_Id
      const findSuite = (suites: Suite[] = [], id: string): Suite | null => {
        for (const s of suites) {
          if (!s) continue;
          if (s.Suite_Id === id) return s;
          const inChild = findSuite(s.Child_Suites || [], id);
          if (inChild) return inChild;
          const inNested = findSuite(s.Suites || [], id);
          if (inNested) return inNested;
        }
        return null;
      };
      
      let suiteMatch: Suite | null = null;
      for (const wrapper of currentSuites) {
        if (!wrapper) continue;
        if (wrapper.Suite_Id === suiteId) {
          suiteMatch = wrapper;
          break;
        }
        if (wrapper.Suites) {
          suiteMatch = findSuite(wrapper.Suites, suiteId);
          if (suiteMatch) break;
        }
      }
      
      if (suiteMatch) {
        result += ` > ${suiteMatch.Suite_Name}`;
        currentSuites = [
          ...(suiteMatch.Child_Suites || []),
          ...(suiteMatch.Suites || []),
        ];
      } else {
        result += ` > ${suiteId}`;
      }
    }
    
    return result;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search box for filtering projects */}
      <TextField
        fullWidth
        placeholder="Search projects by name..."
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
              <IconButton 
                size="small"
                onClick={() => setSearchText('')}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      {/* Display selected paths as chips */}
      {selectedPaths.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Paths ({selectedPaths.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedPaths.map((path) => (
              <Chip
                key={path}
                label={getPathName(path)}
                onDelete={() => toggleSelection(path)}
                size="small"
                color="primary"
              />
            ))}
          </Box>
        </Paper>
      )}
      
      {/* The TreeView (using SimpleTreeView without unsupported props) */}
      <SimpleTreeView
        expanded={expanded}
        onNodeToggle={handleToggle}
        multiSelect
      >
        {!filteredProjects || filteredProjects.length === 0 ? (
          <Typography variant="body2" sx={{ py: 2 }}>
            {!testItData || testItData.length === 0
              ? 'Loading TestIt data...'
              : 'No projects match your search.'}
          </Typography>
        ) : (
          filteredProjects.map((project) => {
            if (!project) return null;
            return renderProjectItem(project);
          })
        )}
      </SimpleTreeView>
    </Box>
  );
};

export default TestItTreeView;
