package com.example.Jqlquerybuilder.service;

import com.example.Jqlquerybuilder.model.Condition;
import com.example.Jqlquerybuilder.utils.JqlQueryUtil;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JqlQueryService {

    public String buildJqlQuery(List<Condition> conditions) {
        return JqlQueryUtil.generateJqlQuery(conditions);
    }

    public String buildExplanation(List<Condition> conditions) {
        return JqlQueryUtil.getCombinedExplanation(conditions);
    }
}