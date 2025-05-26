package com.healapp.repository;

import com.healapp.model.STITest;
import com.healapp.model.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {
    // Change from findByStiTestId to findByStiTest_TestId
    List<TestResult> findByStiTest_TestId(Long testId);

    // OR use a custom query
    @Query("SELECT tr FROM TestResult tr WHERE tr.stiTest.testId = :testId")
    List<TestResult> findByTestId(@Param("testId") Long testId);

    // You can also have a method to find by STITest entity
    List<TestResult> findByStiTest(STITest stiTest);
}