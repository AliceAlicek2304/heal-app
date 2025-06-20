package com.healapp.repository;

import com.healapp.model.STITest;
import com.healapp.model.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {
        // Change from findByStiTestId to findByStiTest_TestId
        List<TestResult> findByStiTest_TestId(Long testId);

        // OR use a custom query
        @Query("SELECT tr FROM TestResult tr WHERE tr.stiTest.testId = :testId")
        List<TestResult> findByTestId(@Param("testId") Long testId);

        // You can also have a method to find by STITest entity
        List<TestResult> findByStiTest(STITest stiTest);

        // Lấy results được sắp xếp theo service và component name (cho package)
        @Query("SELECT tr FROM TestResult tr " +
                        "LEFT JOIN FETCH tr.sourceService s " +
                        "LEFT JOIN FETCH tr.testComponent c " +
                        "WHERE tr.stiTest.testId = :testId " +
                        "ORDER BY s.name ASC, c.testName ASC")
        List<TestResult> findByStiTestTestIdOrderBySourceServiceNameAscTestComponentTestNameAsc(
                        @Param("testId") Long testId);

        // Lấy results theo source service
        @Query("SELECT tr FROM TestResult tr WHERE tr.stiTest.testId = :testId AND tr.sourceService.serviceId = :serviceId")
        List<TestResult> findByTestIdAndSourceServiceId(@Param("testId") Long testId,
                        @Param("serviceId") Long serviceId);

        // Find TestResult by test ID and component ID
        Optional<TestResult> findByStiTest_TestIdAndTestComponent_ComponentId(Long testId, Long componentId);
}