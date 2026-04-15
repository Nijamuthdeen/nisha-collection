package com.nishacollection.service;

import com.nishacollection.dto.*;
import com.nishacollection.exception.*;
import com.nishacollection.model.*;
import com.nishacollection.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private static final BigDecimal GST_RATE = new BigDecimal("0.09");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("ddMMyyyy");

    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAllByOrderByCreatedAtDesc();
    }

    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));
    }

    public Invoice getInvoiceByNumber(String invoiceNo) {
        return invoiceRepository.findByInvoiceNo(invoiceNo)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceNo));
    }

    public List<Invoice> getInvoicesByDateRange(LocalDate from, LocalDate to) {
        return invoiceRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                from.atStartOfDay(), to.atTime(23, 59, 59));
    }

    @Transactional
    public Invoice createInvoice(InvoiceRequest request) {
        BigDecimal subtotal = BigDecimal.ZERO;

        Invoice invoice = Invoice.builder()
                .invoiceNo(generateInvoiceNumber())
                .customerName(request.getCustomerName())
                .customerMobile(request.getCustomerMobile())
                .paymentMethod(request.getPaymentMethod())
                .build();

        for (InvoiceItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.getProductId()));

            if (product.getStock() < itemReq.getQuantity()) {
                throw new BadRequestException(
                    "Insufficient stock for \"" + product.getProductName() + "\". " +
                    "Available: " + product.getStock() + ", Requested: " + itemReq.getQuantity());
            }

            BigDecimal lineTotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            InvoiceItem item = InvoiceItem.builder()
                    .invoice(invoice)
                    .product(product)
                    .productName(product.getProductName())
                    .barcode(product.getBarcode())       // snapshot barcode
                    .unitPrice(product.getPrice())
                    .quantity(itemReq.getQuantity())
                    .totalPrice(lineTotal)
                    .build();

            invoice.getItems().add(item);
            subtotal = subtotal.add(lineTotal);

            // Reduce stock immediately
            product.setStock(product.getStock() - itemReq.getQuantity());
            productRepository.save(product);
        }

        BigDecimal cgstRate = request.getCgstRate() != null
                ? request.getCgstRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
                : GST_RATE;
        BigDecimal sgstRate = request.getSgstRate() != null
                ? request.getSgstRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
                : GST_RATE;

        BigDecimal cgst       = subtotal.multiply(cgstRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal sgst       = subtotal.multiply(sgstRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = subtotal.add(cgst).add(sgst).setScale(2, RoundingMode.HALF_UP);

        invoice.setSubtotal(subtotal);
        invoice.setCgst(cgst);
        invoice.setSgst(sgst);
        invoice.setGrandTotal(grandTotal);

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Created invoice {} | ₹{}", saved.getInvoiceNo(), saved.getGrandTotal());
        return saved;
    }

    private String generateInvoiceNumber() {
        String date = LocalDate.now().format(DATE_FMT);
        long seq    = invoiceRepository.count() + 1;
        return String.format("NC-%s-%04d", date, seq);
    }
}
