package com.ringcentral.engagemetrics.controllers;

import com.ringcentral.engagemetrics.services.TestItDataService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/data/testit")
public class TestItStatsController {

    private final TestItDataService testItDataService;

    /**
     * Get TestIt statistics by providing paths in the format "projectId:suiteId:childSuiteId"
     * 
     * @param request Request body containing paths
     * @return Aggregated statistics for all provided paths
     */
    @PostMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStatsByPaths(@RequestBody TestItStatsRequest request) {
        Map<String, Object> stats = testItDataService.findStatsByHierarchy(request.getPaths());
        return ResponseEntity.ok(stats);
    }

    /**
     * Request body for TestIt stats
     */
    public static class TestItStatsRequest {
        private List<String> paths;

        public List<String> getPaths() {
            return paths;
        }

        public void setPaths(List<String> paths) {
            this.paths = paths;
        }
    }
}