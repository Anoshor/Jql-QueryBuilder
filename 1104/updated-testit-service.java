package com.ringcentral.engagemetrics.services.impl;

import com.ringcentral.engagemetrics.database.mongo.documents.RCTestItData;
import com.ringcentral.engagemetrics.database.mongo.repositories.RCTestItDataRepository;
import com.ringcentral.engagemetrics.modals.api.response.testit.TestItData;
import com.ringcentral.engagemetrics.services.TestItDataService;
import com.ringcentral.engagemetrics.services.mappers.TestItDataMapper;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import static java.util.Objects.isNull;

@Service
@AllArgsConstructor
@Slf4j
public class TestItDataServiceImpl implements TestItDataService {
    private final RCTestItDataRepository rcTestItDataRepository;
    private final TestItDataMapper testItDataMapper;

    @Override
    public List<Map<String, Object>> findStats(List<String> projectNameList, List<String> suiteNameList) {
        return List.of();
    }

    @Override
    public Map<String, Object> findStatsByHierarchy(List<String> paths) {
        List<Map<String, Object>> statsList = new ArrayList<>();
        
        for (String path : paths) {
            String[] parts = path.split(":");
            if (parts.length < 2) {
                statsList.add(Map.of("error", "Invalid path: " + path));
                continue;
            }
            
            String projectId = parts[0];
            String suiteId = parts[parts.length - 1];
            
            RCTestItData doc = rcTestItDataRepository.findByProjectId(projectId);
            if (doc == null) {
                statsList.add(Map.of("error", "No document found for projectId=" + projectId));
                continue;
            }
            
            RCTestItData.TestSuite suite = findSuiteById(doc.getTestSuites(), suiteId);
            if (suite == null) {
                statsList.add(Map.of("error", "SuiteId=" + suiteId + " not found under projectId=" + projectId));
            } else {
                statsList.add(getStringObjectMap(projectId, suiteId, suite));
            }
        }
        
        return aggregateObjectMap(statsList);
    }

    private static Map<String, Object> getStringObjectMap(String projectId, String suiteId, RCTestItData.TestSuite testSuite) {
        Map<String, Object> stat = new HashMap<>();
        stat.put("Total_Test_Cases", testSuite.getTotalTestCases());
        stat.put("Passing_Test_Cases", testSuite.getPassingTestCases());
        stat.put("Failing_Test_Cases", testSuite.getFailingTestCases());
        stat.put("Skipped_Test_Cases", testSuite.getSkippedTestCases());
        stat.put("Automated_Test_Cases", testSuite.getAutomatedTestCases());
        stat.put("Automatable_Test_Cases", testSuite.getAutomatableTestCases());
        return stat;
    }

    private static Map<String, Object> aggregateObjectMap(List<Map<String, Object>> statsList) {
        Map<String, Object> aggregated = new HashMap<>();
        aggregated.put("Total_Test_Cases", 0);
        aggregated.put("Passing_Test_Cases", 0);
        aggregated.put("Failing_Test_Cases", 0);
        aggregated.put("Skipped_Test_Cases", 0);
        aggregated.put("Automated_Test_Cases", 0);
        aggregated.put("Automatable_Test_Cases", 0);
        
        for (Map<String, Object> statMap : statsList) {
            for (String key : aggregated.keySet()) {
                int currentValue = (int) aggregated.getOrDefault(key, 0);
                int addValue = (int) statMap.getOrDefault(key, 0);
                aggregated.put(key, currentValue + addValue);
            }
        }
        
        return aggregated;
    }

    /**
     * Recursively finds a test suite by its ID in a hierarchical structure
     * 
     * @param suiteList List of test suites to search in
     * @param suiteId The ID of the suite to find
     * @return The found TestSuite or null if not found
     */
    private RCTestItData.TestSuite findSuiteById(List<RCTestItData.TestSuite> suiteList, String suiteId) {
        if(isNull(suiteList)) {
            return null;
        }
        
        for(RCTestItData.TestSuite testSuite : suiteList) {
            if(testSuite != null && testSuite.getSuiteId() != null && testSuite.getSuiteId().equals(suiteId)) {
                return testSuite;
            }
            
            // Recursively search in child suites
            if (testSuite != null && testSuite.getChildSuites() != null) {
                RCTestItData.TestSuite foundSuite = findSuiteById(testSuite.getChildSuites(), suiteId);
                if(foundSuite != null) {
                    return foundSuite;
                }
            }
        }
        
        return null;
    }

    @Override
    public void saveOrUpdate(TestItData testItData) {
        RCTestItData newDoc = testItDataMapper.toEntity(testItData);
        
        // Check if document exists
        RCTestItData existingDoc = rcTestItDataRepository.findByProjectId(newDoc.getProjectId());
        if (existingDoc != null) {
            existingDoc.setProjectName(newDoc.getProjectName());
            existingDoc.setProjectPrefix(newDoc.getProjectPrefix());
            existingDoc.setTestSuites(newDoc.getTestSuites());
            rcTestItDataRepository.save(existingDoc);
            log.info("Updated project document for projectId {}", newDoc.getProjectId());
        } else {
            rcTestItDataRepository.save(newDoc);
            log.info("Created new project document for projectId {}", newDoc.getProjectId());
        }
    }
}