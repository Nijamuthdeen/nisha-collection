package com.nishacollection.repository;

import com.nishacollection.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNo(String invoiceNo);

    List<Invoice> findAllByOrderByCreatedAtDesc();

    List<Invoice> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.createdAt BETWEEN :start AND :end AND i.status = 'COMPLETED'")
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i WHERE i.createdAt BETWEEN :start AND :end AND i.status = 'COMPLETED'")
    BigDecimal sumGrandTotalByDateRange(LocalDateTime start, LocalDateTime end);

    // Recent N invoices for dashboard
    @Query("SELECT i FROM Invoice i ORDER BY i.createdAt DESC LIMIT 10")
    List<Invoice> findTop10ByOrderByCreatedAtDesc();
}
