package com.ringcentral.engagemetrics.schedular.api.services;

import com.ringcentral.engagemetrics.schedular.api.model.jira.History;
import com.ringcentral.engagemetrics.schedular.api.model.jira.HistoryItem;
import com.ringcentral.engagemetrics.schedular.api.model.jira.Issues;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class DevelopmentTimeCalculator {
    private final Logger logger = LoggerFactory.getLogger(DevelopmentTimeCalculator.class);
    private static final DateTimeFormatter JIRA_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
    
    // Constants for status transitions
    private static final String STATUS_FIELD = "status";
    private static final String OPEN_STATUS = "Open";
    private static final String IN_PROGRESS_STATUS = "In Progress";
    private static final String CLOSED_STATUS = "Closed";
    private static final String RESOLVED_STATUS = "Resolved";
    private static final String DONE_STATUS = "Done";

    /**
     * Calculate development metrics for an issue
     */
    public DevelopmentMetrics calculateDevelopmentMetrics(Issues issue) {
        DevelopmentMetrics metrics = new DevelopmentMetrics();
        
        try {
            // Set initial created date from issue
            String createdDate = issue.getFields().getCreated();
            metrics.setCreatedDate(createdDate);
            
            if (issue.getChangelog() == null || issue.getChangelog().getHistories() == null) {
                logger.warn("No changelog available for issue: {}", issue.getKey());
                return metrics;
            }
            
            // Sort histories by created date (oldest first)
            List<History> sortedHistories = new ArrayList<>(issue.getChangelog().getHistories());
            sortedHistories.sort(Comparator.comparing(History::getCreated));
            
            // Process each history to track status transitions
            processStatusTransitions(sortedHistories, metrics);
            
            // Calculate durations between key events
            calculateDurations(metrics);
            
        } catch (Exception e) {
            logger.error("Error calculating development metrics for issue: {}", issue.getKey(), e);
        }
        
        return metrics;
    }
    
    private void processStatusTransitions(List<History> histories, DevelopmentMetrics metrics) {
        Set<String> processedStatuses = new HashSet<>();
        
        for (History history : histories) {
            for (HistoryItem item : history.getItems()) {
                // Only process status field changes
                if (STATUS_FIELD.equals(item.getField()) && item.getToString() != null) {
                    String newStatus = item.getToString();
                    
                    // First Open status
                    if (OPEN_STATUS.equals(newStatus) && !processedStatuses.contains(OPEN_STATUS)) {
                        metrics.setOpenDate(history.getCreated());
                        processedStatuses.add(OPEN_STATUS);
                    }
                    
                    // First In Progress status
                    if (IN_PROGRESS_STATUS.equals(newStatus) && !processedStatuses.contains(IN_PROGRESS_STATUS)) {
                        metrics.setInProgressDate(history.getCreated());
                        processedStatuses.add(IN_PROGRESS_STATUS);
                    }
                    
                    // Check for completion statuses (could be any of these)
                    if ((CLOSED_STATUS.equals(newStatus) || RESOLVED_STATUS.equals(newStatus) || 
                         DONE_STATUS.equals(newStatus)) && metrics.getClosedDate() == null) {
                        metrics.setClosedDate(history.getCreated());
                    }
                }
            }
        }
    }
    
    private void calculateDurations(DevelopmentMetrics metrics) {
        // Calculate time to start (from created to in progress)
        if (metrics.getCreatedDate() != null && metrics.getInProgressDate() != null) {
            LocalDateTime createdTime = LocalDateTime.parse(metrics.getCreatedDate(), JIRA_DATE_FORMAT);
            LocalDateTime inProgressTime = LocalDateTime.parse(metrics.getInProgressDate(), JIRA_DATE_FORMAT);
            metrics.setTimeToStart(Duration.between(createdTime, inProgressTime).toHours());
        }
        
        // Calculate development time (from in progress to closed)
        if (metrics.getInProgressDate() != null && metrics.getClosedDate() != null) {
            LocalDateTime inProgressTime = LocalDateTime.parse(metrics.getInProgressDate(), JIRA_DATE_FORMAT);
            LocalDateTime closedTime = LocalDateTime.parse(metrics.getClosedDate(), JIRA_DATE_FORMAT);
            metrics.setDevelopmentTime(Duration.between(inProgressTime, closedTime).toHours());
        }
        
        // Calculate total lead time (from created to closed)
        if (metrics.getCreatedDate() != null && metrics.getClosedDate() != null) {
            LocalDateTime createdTime = LocalDateTime.parse(metrics.getCreatedDate(), JIRA_DATE_FORMAT);
            LocalDateTime closedTime = LocalDateTime.parse(metrics.getClosedDate(), JIRA_DATE_FORMAT);
            metrics.setTotalLeadTime(Duration.between(createdTime, closedTime).toHours());
        }
    }
    
    /**
     * Inner class to hold development metrics for an issue
     */
    public static class DevelopmentMetrics {
        private String createdDate;
        private String openDate;
        private String inProgressDate;
        private String closedDate;
        private Long timeToStart;         // Time from created to in progress (hours)
        private Long developmentTime;     // Time from in progress to closed (hours)
        private Long totalLeadTime;       // Time from created to closed (hours)
        
        // Getters and Setters
        public String getCreatedDate() { return createdDate; }
        public void setCreatedDate(String createdDate) { this.createdDate = createdDate; }
        
        public String getOpenDate() { return openDate; }
        public void setOpenDate(String openDate) { this.openDate = openDate; }
        
        public String getInProgressDate() { return inProgressDate; }
        public void setInProgressDate(String inProgressDate) { this.inProgressDate = inProgressDate; }
        
        public String getClosedDate() { return closedDate; }
        public void setClosedDate(String closedDate) { this.closedDate = closedDate; }
        
        public Long getTimeToStart() { return timeToStart; }
        public void setTimeToStart(Long timeToStart) { this.timeToStart = timeToStart; }
        
        public Long getDevelopmentTime() { return developmentTime; }
        public void setDevelopmentTime(Long developmentTime) { this.developmentTime = developmentTime; }
        
        public Long getTotalLeadTime() { return totalLeadTime; }
        public void setTotalLeadTime(Long totalLeadTime) { this.totalLeadTime = totalLeadTime; }
    }
}
