package com.nishacollection.service;

import com.nishacollection.exception.*;
import com.nishacollection.model.Product;
import com.nishacollection.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAllByOrderByCreatedAtDesc();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    public Product getProductByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + barcode));
    }

    public List<Product> searchProducts(String query) {
        return productRepository.searchByNameOrBarcode(query);
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    @Transactional
    public Product createProduct(Product product) {
        if (product.getBarcode() == null || product.getBarcode().isBlank()) {
            product.setBarcode(generateBarcode());
        } else if (productRepository.existsByBarcode(product.getBarcode())) {
            throw new BadRequestException("Barcode already exists: " + product.getBarcode());
        }
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, Product updated) {
        Product existing = getProductById(id);
        if (updated.getBarcode() != null
                && !updated.getBarcode().equals(existing.getBarcode())
                && productRepository.existsByBarcode(updated.getBarcode())) {
            throw new BadRequestException("Barcode already exists: " + updated.getBarcode());
        }
        existing.setProductName(updated.getProductName());
        existing.setPrice(updated.getPrice());
        existing.setStock(updated.getStock());
        existing.setLowStockAlert(updated.getLowStockAlert());
        existing.setCategory(updated.getCategory());
        existing.setDescription(updated.getDescription());
        if (updated.getBarcode() != null && !updated.getBarcode().isBlank()) {
            existing.setBarcode(updated.getBarcode());
        }
        return productRepository.save(existing);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        // Null-out the product reference in all invoice_items so FK won't block deletion
        // (invoice_items.product_id is now nullable — set via native query)
        productRepository.nullifyProductInInvoiceItems(id);
        productRepository.delete(product);
        log.info("Deleted product ID {}", id);
    }

    @Transactional
    public void reduceStock(Long productId, int quantity) {
        Product p = getProductById(productId);
        if (p.getStock() < quantity) {
            throw new BadRequestException("Insufficient stock for: " + p.getProductName());
        }
        p.setStock(p.getStock() - quantity);
        productRepository.save(p);
    }

    private String generateBarcode() {
        String bc;
        do { bc = "NC" + (System.currentTimeMillis() % 1_000_000_000L); }
        while (productRepository.existsByBarcode(bc));
        return bc;
    }
}
