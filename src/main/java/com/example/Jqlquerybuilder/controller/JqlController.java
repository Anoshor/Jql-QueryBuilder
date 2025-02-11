package com.example.Jqlquerybuilder.controller;

import com.example.Jqlquerybuilder.model.Condition;
import com.example.Jqlquerybuilder.model.JqlResponse;
import com.example.Jqlquerybuilder.service.JqlQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/jql")
public class JqlController {

    private final JqlQueryService queryService;

    @Autowired
    public JqlController(JqlQueryService queryService) {
        this.queryService = queryService;
    }

    @PostMapping("/generate")
    public ResponseEntity<JqlResponse> generateJql(@RequestBody List<Condition> conditions) {
        String jql = queryService.buildJqlQuery(conditions);
        String explanation = queryService.buildExplanation(conditions);
        JqlResponse response = new JqlResponse(jql, explanation);
        return ResponseEntity.ok(response);
    }
}
