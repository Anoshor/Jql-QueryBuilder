import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Badge,
  Button,
  Chip,
  Grid,
  Divider,
  TextField,
  FormGroup,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminConfigService from '../../services/AdminConfigService';
import { Project, SonarDomain, SonarProject, TestItProject, TeamConfig } from './types';
import TestItTreeView from './TestItTreeView';

interface TestConfigStepProps {
  selectedProjects: Project[];
  projectTeams: Record<string, string[]>;
  currentProjectIndex: number;
  teamConfigs: Record<string, Record<string, TeamConfig>>;
  onProjectTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onTeamConfigChange: (project: string, team: string, config: TeamConfig) => void;
}

export const TestConfigStep: React.FC<TestConfigStepProps> = ({
  selectedProjects,
  projectTeams,
  currentProjectIndex,
  teamConfigs,
  onProjectTabChange,
  onTeamConfigChange,
}) => {
  const [sonarDomainSearchText, setSonarDomainSearchText] = useState('');
  const [sonarProjectSearchText, setSonarProjectSearchText] = useState('');
  const [activeSonarDomain, setActiveSonarDomain] = useState<string>('');
  const [selectAllStatus, setSelectAllStatus] = useState<Record<string, boolean>>({});
  const [expandedTeam, setExpandedTeam] = useState<string | false>(false);
  const [testItData, setTestItData] = useState<TestItProject[]>([]);
  const [sonarData, setSonarData] = useState<SonarDomain[]>([]);
  
  const currentProject = selectedProjects[currentProjectIndex]?.key || '';
  const currentProjectTeams = projectTeams[currentProject] || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testItResponse, sonarResponse] = await AdminConfigService.fetchTestItAndSonarData();
        setTestItData(testItResponse);
        const transformedSonarData = sonarResponse.map((domain: SonarDomain) => ({
          ...domain,
          sonarDomain: domain.sonarDomain.split('.')[0],
        }));
        setSonarData(transformedSonarData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const isTeamConfigComplete = (project: string, team: string): boolean => {
    const config = teamConfigs[project]?.[team];
    if (!config) return true;
    const hasIncompleteTestIt = config.testItPaths.length === 0;
    const hasIncompleteSonar = config.sonarQubeProjects.some(s => s.sonarProjects.length === 0);
    return !(hasIncompleteTestIt || hasIncompleteSonar);
  };

  const handleTestItPathsChange = (project: string, team: string, paths: string[]) => {
    const currentConfig = teamConfigs[project]?.[team] || { testItPaths: [], sonarQubeProjects: [] };
    onTeamConfigChange(project, team, { ...currentConfig, testItPaths: paths });
  };

  const handleSonarDomainToggle = (project: string, team: string, sonarDomain: string) => {
    const currentConfig = teamConfigs[project]?.[team] || { testItPaths: [], sonarQubeProjects: [] };
    const existingDomain = currentConfig.sonarQubeProjects.find(s => s.sonarDomain === sonarDomain);
    let newSonarProjects;
    if (existingDomain) {
      newSonarProjects = currentConfig.sonarQubeProjects.filter(s => s.sonarDomain !== sonarDomain);
      if (activeSonarDomain === sonarDomain) {
        setActiveSonarDomain('');
      }
    } else {
      newSonarProjects = [...currentConfig.sonarQubeProjects, { sonarDomain, sonarProjects: [] }];
      setActiveSonarDomain(sonarDomain);
    }
    onTeamConfigChange(project, team, { ...currentConfig, sonarQubeProjects: newSonarProjects });
  };

  const handleSonarProjectToggle = (project: string, team: string, sonarDomain: string, sonarProject: string) => {
    const currentConfig = teamConfigs[project]?.[team] || { testItPaths: [], sonarQubeProjects: [] };
    const domainIndex = currentConfig.sonarQubeProjects.findIndex(s => s.sonarDomain === sonarDomain);
    if (domainIndex === -1) return;
    const currentProjects = currentConfig.sonarQubeProjects[domainIndex].sonarProjects;
    const newProjects = currentProjects.includes(sonarProject)
      ? currentProjects.filter(p => p !== sonarProject)
      : [...currentProjects, sonarProject];
    const newSonarQubeProjects = [...currentConfig.sonarQubeProjects];
    newSonarQubeProjects[domainIndex] = { ...newSonarQubeProjects[domainIndex], sonarProjects: newProjects };
    onTeamConfigChange(project, team, { ...currentConfig, sonarQubeProjects: newSonarQubeProjects });
  };

  const handleToggleAllSonarProjects = (project: string, team: string, sonarDomain: string) => {
    const currentConfig = teamConfigs[project]?.[team] || { testItPaths: [], sonarQubeProjects: [] };
    const domainIndex = currentConfig.sonarQubeProjects.findIndex(s => s.sonarDomain === sonarDomain);
    if (domainIndex === -1) return;
    const isCurrentlySelectAll = selectAllStatus[`${team}-${sonarDomain}`] || false;
    const domain = sonarData.find(d => d.sonarDomain === sonarDomain);
    const allProjects = domain?.projects.map(p => p.project) || [];
    const newProjects = isCurrentlySelectAll ? [] : allProjects;
    const newSonarQubeProjects = [...currentConfig.sonarQubeProjects];
    newSonarQubeProjects[domainIndex] = {
      ...newSonarQubeProjects[domainIndex],
      sonarProjects: newProjects,
    };
    setSelectAllStatus(prev => ({
      ...prev,
      [`${team}-${sonarDomain}`]: !isCurrentlySelectAll,
    }));
    onTeamConfigChange(project, team, { ...currentConfig, sonarQubeProjects: newSonarQubeProjects });
  };

  const handleSetActiveSonarDomain = (sonarDomain: string) => {
    setActiveSonarDomain(sonarDomain);
  };

  const filteredSonarDomains = sonarData.filter(domain =>
    domain.sonarDomain.toLowerCase().includes(sonarDomainSearchText.toLowerCase())
  );

  const getFilteredSonarProjects = (domainName: string): SonarProject[] => {
    const domain = sonarData.find(d => d.sonarDomain === domainName);
    if (!domain) return [];
    return domain.projects.filter(p =>
      p.project.toLowerCase().includes(sonarProjectSearchText.toLowerCase())
    );
  };

  const handleAccordionChange = (team: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedTeam(isExpanded ? team : false);
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Configure Test and Sonar Properties
      </Typography>
      
      <Tabs
        value={currentProjectIndex}
        onChange={onProjectTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {selectedProjects.map((project, index) => {
          const teamsCount = projectTeams[project.key]?.length || 0;
          const configuredCount = projectTeams[project.key]?.filter(team =>
            isTeamConfigComplete(project.key, team)
          ).length || 0;
          return (
            <Tab
              key={project.key}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {project.name} ({project.key})
                  <Badge badgeContent={`${configuredCount}/${teamsCount}`} color="primary" sx={{ ml: 1 }} />
                  {configuredCount === teamsCount ? (
                    <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                  ) : (
                    <ErrorIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                  )}
                </Box>
              }
            />
          );
        })}
      </Tabs>
      
      {currentProjectTeams.map(team => {
        const teamConfig = teamConfigs[currentProject]?.[team] || { testItPaths: [], sonarQubeProjects: [] };
        const isComplete = isTeamConfigComplete(currentProject, team);
        return (
          <Accordion key={team} expanded={expandedTeam === team} onChange={handleAccordionChange(team)} sx={{ mb: 1 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ backgroundColor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Team: {team}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isComplete ? (
                    <Chip size="small" color="success" icon={<CheckCircleIcon />} label="Configured" />
                  ) : (
                    <Chip size="small" color="error" icon={<ErrorIcon />} label="Incomplete" />
                  )}
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
                    Automation Coverage
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Select TestIt Paths
                    </Typography>
                    <TestItTreeView
                      testItData={testItData}
                      selectedPaths={teamConfig.testItPaths}
                      onPathsChange={(paths) => handleTestItPathsChange(currentProject, team, paths)}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
                    Code Coverage
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Sonar Domains
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search Sonar domains..."
                        value={sonarDomainSearchText}
                        onChange={(e) => setSonarDomainSearchText(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                          endAdornment: sonarDomainSearchText && (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setSonarDomainSearchText('')}>
                                <ClearIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      {teamConfig.sonarQubeProjects.length > 0 && (
                        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {teamConfig.sonarQubeProjects.map(config => (
                            <Chip
                              key={config.sonarDomain}
                              label={config.sonarDomain}
                              onClick={() => handleSetActiveSonarDomain(config.sonarDomain)}
                              onDelete={() => handleSonarDomainToggle(currentProject, team, config.sonarDomain)}
                              color={activeSonarDomain === config.sonarDomain ? 'primary' : 'default'}
                              variant={activeSonarDomain === config.sonarDomain ? 'filled' : 'outlined'}
                              size="small"
                            />
                          ))}
                        </Box>
                      )}
                      <Paper sx={{ maxHeight: 300, overflow: 'auto', p: 2 }}>
                        <FormGroup>
                          {filteredSonarDomains.map(domain => (
                            <Box
                              key={domain.id}
                              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', py: 0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
                            >
                              <Checkbox
                                checked={teamConfig.sonarQubeProjects.some(s => s.sonarDomain === domain.sonarDomain)}
                                onChange={() => handleSonarDomainToggle(currentProject, team, domain.sonarDomain)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Box sx={{ ml: 1 }} onClick={() => handleSetActiveSonarDomain(domain.sonarDomain)}>
                                <Typography variant="body2">
                                  {domain.sonarDomain}
                                  {activeSonarDomain === domain.sonarDomain && ' (Active)'}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </FormGroup>
                      </Paper>
                    </Grid>
                    <Grid item xs={0.5}>
                      <Divider orientation="vertical" />
                    </Grid>
                    <Grid item xs={5.5}>
                      <Typography variant="subtitle2" gutterBottom>
                        {activeSonarDomain ? `Projects for "${activeSonarDomain}"` : 'Select a Sonar domain to view projects'}
                      </Typography>
                      {activeSonarDomain && (
                        <>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Search Sonar projects..."
                            value={sonarProjectSearchText}
                            onChange={(e) => setSonarProjectSearchText(e.target.value)}
                            sx={{ mb: 2 }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon />
                                </InputAdornment>
                              ),
                              endAdornment: sonarProjectSearchText && (
                                <InputAdornment position="end">
                                  <IconButton size="small" onClick={() => setSonarProjectSearchText('')}>
                                    <ClearIcon />
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                          {(() => {
                            const activeConfig = teamConfig.sonarQubeProjects.find(s => s.sonarDomain === activeSonarDomain);
                            const activeProjects = activeConfig?.sonarProjects || [];
                            return (
                              activeProjects.length > 0 && (
                                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                  <Typography variant="body2" gutterBottom>
                                    Selected Projects ({activeProjects.length}):
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {activeProjects.map(proj => (
                                      <Chip
                                        key={proj}
                                        label={proj}
                                        onDelete={() => handleSonarProjectToggle(currentProject, team, activeSonarDomain, proj)}
                                        size="small"
                                        color="secondary"
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )
                            );
                          })()}
                          <Box sx={{ mb: 2 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleToggleAllSonarProjects(currentProject, team, activeSonarDomain)}
                            >
                              {selectAllStatus[`${team}-${activeSonarDomain}`] ? 'Deselect All' : 'Select All'}
                            </Button>
                          </Box>
                          <Paper sx={{ maxHeight: 300, overflow: 'auto', p: 2 }}>
                            <FormGroup>
                              {getFilteredSonarProjects(activeSonarDomain).map(proj => {
                                const activeConfig = teamConfig.sonarQubeProjects.find(s => s.sonarDomain === activeSonarDomain);
                                const isChecked = activeConfig?.sonarProjects.includes(proj.project) || false;
                                return (
                                  <FormControlLabel
                                    key={proj.project}
                                    control={<Checkbox checked={isChecked} onChange={() => handleSonarProjectToggle(currentProject, team, activeSonarDomain, proj.project)} />}
                                    label={proj.project}
                                  />
                                );
                              })}
                            </FormGroup>
                          </Paper>
                        </>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};

export default TestConfigStep;
