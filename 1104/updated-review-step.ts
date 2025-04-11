import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminConfigService from '../../services/AdminConfigService';
import { Project, TeamConfig } from './types';

interface ReviewStepProps {
  selectedOrg: string;
  selectedProjects: Project[];
  projectTeams: Record<string, string[]>;
  teamMembers: Record<string, Record<string, string[]>>;
  teamConfigs: Record<string, Record<string, TeamConfig>>;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  selectedOrg,
  selectedProjects,
  projectTeams,
  teamMembers,
  teamConfigs,
}) => {
  const [testItData, setTestItData] = useState<any[]>([]);
  const [expandedProject, setExpandedProject] = useState<string | false>(false);

  useEffect(() => {
    const fetchTestItData = async () => {
      try {
        const [testItResponse] = await AdminConfigService.fetchTestItAndSonarData();
        setTestItData(testItResponse);
      } catch (error) {
        console.error('Error fetching TestIt data:', error);
      }
    };
    fetchTestItData();
  }, []);

  const handleProjectExpand = (project: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedProject(isExpanded ? project : false);
  };

  // Helper function to get human-readable path display names
  const getPathDisplayName = (path: string): string => {
    if (!testItData.length) return path;
    
    const parts = path.split(':');
    const projectId = parts[0];
    const project = testItData.find(p => p['Project ID'] === projectId);
    
    if (!project) return path;
    
    let displayName = `${project['Project Name']} - `;
    let currentSuites = project['Test Suites'][0]?.Suites || [];
    
    for (let i = 1; i < parts.length; i++) {
      const suiteId = parts[i];
      const suite = currentSuites.find((s: any) => s.Suite_Id === suiteId);
      
      if (suite) {
        displayName += (i > 1 ? ' > ' : '') + suite['Suite Name'];
        currentSuites = suite.Child_Suites || [];
      } else {
        displayName += (i > 1 ? ' > ' : '') + suiteId;
        break;
      }
    }
    
    return displayName;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Configuration
      </Typography>
      
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Organization: <strong>{selectedOrg}</strong>
        </Typography>
      </Paper>
      
      {selectedProjects.map((project) => {
        const teamsForProject = projectTeams[project.key] || [];
        
        return (
          <Accordion
            key={project.key}
            expanded={expandedProject === project.key}
            onChange={handleProjectExpand(project.key)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                Project: <strong>{project.name}</strong> ({project.key})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {teamsForProject.map((team) => {
                  const members = teamMembers[project.key]?.[team] || [];
                  const teamConfig = teamConfigs[project.key]?.[team] || { testItPaths: [], sonarQubeProjects: [] };
                  
                  return (
                    <Box key={team} sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Team: {team}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Members ({members.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {members.map((member) => (
                            <Chip key={member} label={member} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={2}>
                        {/* TestIt Paths */}
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            TestIt Paths ({teamConfig.testItPaths.length}):
                          </Typography>
                          {teamConfig.testItPaths.length > 0 ? (
                            <List dense sx={{ bgcolor: 'background.paper', maxHeight: 300, overflow: 'auto' }}>
                              {teamConfig.testItPaths.map((path) => (
                                <ListItem key={path} sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                                  <ListItemText 
                                    primary={getPathDisplayName(path)}
                                    secondary={`Raw path: ${path}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No TestIt paths configured
                            </Typography>
                          )}
                        </Grid>
                        
                        {/* Sonar Projects */}
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            SonarQube Projects:
                          </Typography>
                          {teamConfig.sonarQubeProjects.length > 0 ? (
                            teamConfig.sonarQubeProjects.map((sonarConfig) => (
                              <Box key={sonarConfig.sonarDomain} sx={{ mb: 2 }}>
                                <Typography variant="body2" fontWeight="bold" gutterBottom>
                                  Domain: {sonarConfig.sonarDomain}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {sonarConfig.sonarProjects.map((project) => (
                                    <Chip key={project} label={project} size="small" />
                                  ))}
                                </Box>
                              </Box>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No SonarQube projects configured
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default ReviewStep;