package com.ringcentral.engagemetrics.schedular.utils;

import com.ringcentral.engagemetrics.schedular.api.model.jira.Issues;
import com.ringcentral.engagemetrics.schedular.api.services.DevelopmentTimeCalculator;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class CSVExporter {
    private static final Logger logger = LoggerFactory.getLogger(CSVExporter.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
    private static final DevelopmentTimeCalculator timeCalculator = new DevelopmentTimeCalculator();

    public static void exportStoriesToCSV(List<Issues> issues, String filePath) {
        try (BufferedWriter writer = Files.newBufferedWriter(Paths.get(filePath));
             CSVPrinter csvPrinter = new CSVPrinter(writer,
                     CSVFormat.DEFAULT.withHeader(
                             "User Story Key", 
                             "Status Id", 
                             "Assignee", 
                             "Created", 
                             "Due Date", 
                             "Updated", 
                             "Story Points", 
                             "Project ID", 
                             "Priority", 
                             "Created Month", 
                             "Resolved Month", 
                             "Year", 
                             "Total Lead Time (hrs)",
                             "Time to Start (hrs)",
                             "Development Time (hrs)",
                             "First Open Date",
                             "First In Progress Date",
                             "Closed Date"))) {
            
            issues.forEach(issue -> {
                String key = issue.getKey();
                String assigneeName = (issue.getFields().getAssignee() != null) ? issue.getFields().getAssignee().getName() : "";
                String statusId = (issue.getFields().getStatus() != null && issue.getFields().getStatus().getId() != null)
                        ? issue.getFields().getStatus().getId() : "";
                String created = issue.getFields().getCreated();
                String duedate = issue.getFields().getDuedate();
                String updated = issue.getFields().getUpdated();
                String resolvedDate = (issue.getFields().getResolutionDate() != null) ? issue.getFields().getResolutionDate() : "";
                String priority = (issue.getFields().getPriority() != null) ? issue.getFields().getPriority().getName() : "";
                String storyPoints = issue.getFields().getStoryPoint();
                String projectKey = (issue.getFields().getProject() != null) ? issue.getFields().getProject().getKey() : "";
                
                String createdMonth = !created.isEmpty() ?
                        LocalDateTime.parse(created, formatter).getMonth().name().substring(0, 3) : "";
                String resolvedMonth = !resolvedDate.isEmpty() ?
                        LocalDateTime.parse(resolvedDate, formatter).getMonth().name().substring(0, 3) : "";
                String resolvedYear = !resolvedDate.isEmpty() ?
                        String.valueOf(LocalDateTime.parse(resolvedDate, formatter).getYear()) : "";
                
                // Calculate development time metrics
                DevelopmentTimeCalculator.DevelopmentMetrics metrics = timeCalculator.calculateDevelopmentMetrics(issue);
                
                try {
                    csvPrinter.printRecord(
                            key, 
                            statusId, 
                            assigneeName, 
                            created, 
                            duedate, 
                            updated, 
                            storyPoints, 
                            projectKey,
                            priority, 
                            createdMonth, 
                            resolvedMonth, 
                            resolvedYear, 
                            metrics.getTotalLeadTime(),
                            metrics.getTimeToStart(),
                            metrics.getDevelopmentTime(),
                            metrics.getOpenDate(),
                            metrics.getInProgressDate(),
                            metrics.getClosedDate()
                    );
                } catch (IOException e) {
                    logger.error("Error writing CSV record", e);
                }
            });
            
            csvPrinter.flush();
        } catch (IOException e) {
            logger.error("Error writing CSV file", e);
        }
    }
}
