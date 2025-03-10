package com.ringcentral.engagemetrics.schedular.api.queries;

import com.ringcentral.engagemetrics.schedular.api.config.FeignClientInterceptor;
import com.ringcentral.engagemetrics.schedular.api.model.jira.Response;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "jira-api", url = "${jira.api.base.url}", configuration = FeignClientInterceptor.class)
public interface JiraApiClient {
    /**
     * Get issues from JIRA API with optional changelog expansion
     *
     * @param jql JQL query string
     * @param startAt pagination start index
     * @param maxResults maximum results to return
     * @param fields comma-separated list of fields to return
     * @param expand comma-separated list of expansions (e.g., "changelog")
     * @return JIRA API response with issues
     */
    @GetMapping("/search")
    Response getIssues(@RequestParam("jql") String jql,
                       @RequestParam("startAt") int startAt,
                       @RequestParam("maxResults") int maxResults,
                       @RequestParam("fields") String fields,
                       @RequestParam("expand") String expand);
}
