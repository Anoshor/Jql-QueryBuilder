package com.ringcentral.engagemetrics.schedular.api.services;

import com.ringcentral.engagemetrics.schedular.api.model.jira.Issues;
import com.ringcentral.engagemetrics.schedular.api.model.jira.Response;
import com.ringcentral.engagemetrics.schedular.utils.CSVExporter;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoryTableThread {
    private final Logger logger = LoggerFactory.getLogger(StoryTableThread.class);
    private final JiraApiService jiraApiService;
    private final int maxResults = 1000;
    
    // Core fields needed for analysis
    private static final String CORE_FIELDS = "key,status,assignee,created,duedate,updated,resolutiondate,priority,customfield_10002,project";
    
    // Expand changelog with specific fields and filter for status changes
    private static final String CHANGELOG_EXPAND = "changelog";
    
    public void queryTable(String jqlQuery) {
        queryTable(jqlQuery, CORE_FIELDS, CHANGELOG_EXPAND);
    }
    
    public void queryTable(String jqlQuery, String fields, String expand) {
        try {
            logger.info("Fetching Story issues from Jira...");
            int startAt = 0;
            boolean hasMore = true;
            List<Issues> allIssues = new ArrayList<>();
            
            while (hasMore) {
                logger.info("Fetching batch starting at {}", startAt);
                Response jiraResponse = jiraApiService.getJiraData(jqlQuery, startAt, maxResults, fields, expand);
                List<Issues> issues = jiraResponse.getIssues();
                
                if (issues == null || issues.isEmpty()) {
                    logger.info("No more issues found.");
                    break;
                }
                
                allIssues.addAll(issues);
                logger.info("Fetched {} issues, total collected: {}", issues.size(), allIssues.size());
                
                // Check if we've processed all issues
                startAt += maxResults;
                hasMore = (issues.size() == maxResults && startAt < jiraResponse.getTotal());
            }
            
            // Dump all issues to CSV
            CSVExporter.exportStoriesToCSV(allIssues, "stories.csv");
            logger.info("Data dumped to CSV with {} total records.", allIssues.size());
            
        } catch (Exception e) {
            logger.error("Error fetching Jira issues", e);
        }
    }
}
