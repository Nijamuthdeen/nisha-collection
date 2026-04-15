package com.nishacollection.dto;

import com.nishacollection.model.Invoice;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

// ===================== Invoice Request =====================
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {

    private String customerName;

    @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be 10 digits")
    private String customerMobile;

    @NotNull(message = "Payment method is required")
    private Invoice.PaymentMethod paymentMethod;

    @NotNull @NotEmpty(message = "At least one item is required")
    @Valid
    private List<InvoiceItemRequest> items;

    private BigDecimal cgstRate;
    private BigDecimal sgstRate;
}

// ===================== Invoice Item Request =====================
@Data
@NoArgsConstructor
@AllArgsConstructor
class InvoiceItemRequestInner {
    @NotNull
    private Long productId;

    @NotNull @Min(1)
    private Integer quantity;
}
