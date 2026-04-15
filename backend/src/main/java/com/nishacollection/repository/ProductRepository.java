package com.nishacollection.repository;

import com.nishacollection.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByBarcode(String barcode);

    List<Product> findAllByOrderByCreatedAtDesc();

    @Query("SELECT p FROM Product p WHERE p.stock <= p.lowStockAlert ORDER BY p.stock ASC")
    List<Product> findLowStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.stock <= p.lowStockAlert")
    long countLowStockProducts();

    boolean existsByBarcode(String barcode);

    @Query("SELECT p FROM Product p WHERE LOWER(p.productName) LIKE LOWER(CONCAT('%', :query, '%')) OR p.barcode = :query ORDER BY p.productName")
    List<Product> searchByNameOrBarcode(String query);

    // Set product_id = NULL in invoice_items before deleting the product
    @Modifying
    @Query(value = "UPDATE invoice_items SET product_id = NULL WHERE product_id = :productId", nativeQuery = true)
    void nullifyProductInInvoiceItems(Long productId);
}
