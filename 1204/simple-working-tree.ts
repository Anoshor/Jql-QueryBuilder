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
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import { TestItProject } from './types';

interface TestItTreeViewProps {
  testItData: TestItProject[];
  selectedPaths: string[];
  onPathsChange: (paths: string[]) => void;
}

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
   * Expand all top-level projects by default (their nodeIds = project['Project ID']).
   * If you want to expand all suites as well, you'd do a recursive approach or handle it differently.
   */
  useEffect(() => {
    if (testItData && testItData.length > 0) {
      const topLevelIds = testItData.map((p) => p['Project ID']);
      setExpanded(topLevelIds);
    }
  }, [testItData]);

  /**
   * Called by MUI TreeView whenever a node is expanded or collapsed.
   * 'nodeIds' is the updated list of expanded node IDs.
   */
  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
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
   * Filter the top-level projects by the search text (project name).
   * If you also want to filter suite names, you'd do deeper recursion. 
   * Currently we only filter at the project level.
   */
  const filteredProjects = searchText
    ? testItData.filter((p) =>
        p['Project Name'].toLowerCase().includes(searchText.toLowerCase())
      )
    : testItData;

  /**
   * Recursively render a suite as a TreeItem, including child suites.
   */
  const renderSuiteItem = (
    suite: any,
    projectId: string,
    parentPath: string = ''
  ): React.ReactNode => {
    if (!suite || !suite.Suite_Id) return null;

    // Build the "projectId:suiteId" or deeper path
    const thisPath = parentPath
      ? `${parentPath}:${suite.Suite_Id}`
      : `${projectId}:${suite.Suite_Id}`;

    // We combine Child_Suites and Suites into a single children array
    const children = [
      ...(suite.Child_Suites || []),
      ...(suite.Suites || []),
    ].filter(Boolean);

    // Is this suite's path currently selected?
    const isSelected = selectedPaths.includes(thisPath);

    // We'll show a checkbox + suite name for the label
    const label = (
      <Box
        sx={{ display: 'flex', alignItems: 'center' }}
        onClick={(e) => {
          // Prevent expanding/collapsing when clicking the label's interior elements
          e.stopPropagation();
        }}
      >
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={() => toggleSelection(thisPath)}
          onClick={(e) => e.stopPropagation()}
        />
        <Typography
          variant="body2"
          sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}
        >
          {suite['Suite Name']}
        </Typography>
        {suite.Total_Test_Cases ? (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            ({suite.Total_Test_Cases} tests)
          </Typography>
        ) : null}
      </Box>
    );

    return (
      <TreeItem
        key={thisPath}
        nodeId={thisPath}
        label={label}
      >
        {/* Recursively render child suites */}
        {children.map((child: any) =>
          renderSuiteItem(child, projectId, thisPath)
        )}
      </TreeItem>
    );
  };

  /**
   * Render a top-level project as a TreeItem. 
   * Each project's ID is the nodeId. 
   * Then each "Test Suite" inside it is rendered with `renderSuiteItem`.
   */
  const renderProjectItem = (project: TestItProject) => {
    const projectId = project['Project ID'];
    return (
      <TreeItem
        key={projectId}
        nodeId={projectId}
        label={
          <Typography variant="subtitle2">{project['Project Name']}</Typography>
        }
      >
        {project['Test Suites'].map((suiteWrapper) => {
          // Some data might store a direct suite or an object that has .Suites
          if (suiteWrapper.Suite_Id) {
            return renderSuiteItem(suiteWrapper, projectId);
          }
          if (suiteWrapper.Suites) {
            return suiteWrapper.Suites.map((suite: any) =>
              renderSuiteItem(suite, projectId)
            );
          }
          return null;
        })}
      </TreeItem>
    );
  };

  /**
   * Convert a path "projectId:suiteId:childSuiteId" to a human-readable chain 
   * like "Project Name > Suite Name > Child Suite Name".
   */
  const getPathName = (path: string): string => {
    const parts = path.split(':');
    if (parts.length < 1) return path;

    // The first part is the projectId
    const projectId = parts[0];
    const project = testItData.find((p) => p['Project ID'] === projectId);
    if (!project) return path;

    let result = project['Project Name'];

    // For deeper parts, we look up the suite by ID
    let currentSuites = project['Test Suites'];
    for (let i = 1; i < parts.length; i++) {
      const suiteId = parts[i];

      // Helper to recursively find suite by ID
      const findSuite = (suites: any[] = [], id: string): any => {
        for (const s of suites) {
          if (!s) continue;
          if (s.Suite_Id === id) return s;
          const inChild = findSuite(s.Child_Suites, id);
          if (inChild) return inChild;
          const inNested = findSuite(s.Suites, id);
          if (inNested) return inNested;
        }
        return null;
      };

      let suiteMatch: any = null;
      // Some testIt data has top-level "suiteWrapper" with .Suite_Id or .Suites
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
        result += ` > ${suiteMatch['Suite Name']}`;
        // Next iteration must look for deeper children in suiteMatch
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
    <Box>
      {/* Search box (only searching top-level project names) */}
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

      {/* Display all selected paths as chips */}
      {selectedPaths.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" gutterBottom>
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
        </Box>
      )}

      {/* The actual TreeView */}
      <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
        {!filteredProjects || filteredProjects.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {!testItData || testItData.length === 0
              ? 'Loading TestIt data...'
              : 'No matching projects found'}
          </Typography>
        ) : (
          <TreeView
            expanded={expanded}
            onNodeToggle={handleToggle}
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
          >
            {filteredProjects.map((project) => {
              if (!project) return null;
              return renderProjectItem(project);
            })}
          </TreeView>
        )}
      </Paper>
    </Box>
  );
};

export default TestItTreeView;
