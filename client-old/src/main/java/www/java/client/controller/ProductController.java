package www.java.client.controller;

import www.java.client.annotation.RequireAdmin;
import www.java.client.model.Product;
import www.java.client.model.PaginatedResponse;
import www.java.client.service.ProductService;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import jakarta.servlet.http.HttpServletRequest;

@Controller
@RequestMapping("/products")
@RequireAdmin
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public String list(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "5") int size,
            @RequestParam(value = "sort", defaultValue = "id") String sort,
            @RequestParam(value = "direction", defaultValue = "ASC") String direction,
            @RequestParam(value = "id", required = false) String id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "sku", required = false) String sku,
            @RequestParam(value = "brand", required = false) String brand,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "search", required = false) String search,
            Model model,
            HttpServletRequest request) {

        // Nếu truy cập lần đầu không có query string, redirect sang URL mong muốn
        if (request.getQueryString() == null || request.getQueryString().isBlank()) {
            return "redirect:/products?page=1&size=5&sort=id&direction=ASC";
        }

        page = Math.max(1, page);
        size = Math.min(Math.max(5, size), 100);
        direction = "desc".equalsIgnoreCase(direction) ? "desc" : "asc";

        System.out.println("[FE/ProductController] incoming queryString=" + request.getQueryString());
        PaginatedResponse<Product> resp = productService.getProductsWithPagination(
            page, size, sort, direction, id, name, sku, brand, null, null, isActive, search
        );
        System.out.println("[FE/ProductController] parsed result size=" + (resp != null && resp.getResult() != null ? resp.getResult().size() : -1));
        if (resp != null && resp.getMetadata() != null) {
            System.out.println("[FE/ProductController] metadata: page=" + resp.getMetadata().getPage() + 
                ", size=" + resp.getMetadata().getSize() + ", totalElements=" + resp.getMetadata().getTotalElements());
        }

        PaginatedResponse.Metadata m = resp.getMetadata();
        int currentPage = m != null ? m.getPage() : page;
        int totalPages = m != null ? m.getTotalPages() : 1;
        long totalElements = m != null ? m.getTotalElements() : 0;

        model.addAttribute("products", resp.getResult());
        model.addAttribute("currentPage", currentPage);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("totalElements", totalElements);
        model.addAttribute("hasNext", currentPage < totalPages);
        model.addAttribute("hasPrev", currentPage > 1);
        model.addAttribute("sort", sort);
        model.addAttribute("direction", direction);
        model.addAttribute("id", id);
        model.addAttribute("name", name);
        model.addAttribute("sku", sku);
        model.addAttribute("brand", brand);
        model.addAttribute("isActive", isActive);
        model.addAttribute("search", search);
        model.addAttribute("size", size);

        return "products/list-admin";
    }

    @PostMapping
    public String create(@ModelAttribute Product product, RedirectAttributes ra) {
        try {
            if (product.getIsActive() == null) product.setIsActive(true);
            Product created = productService.createProduct(product);
            if (created != null) {
                ra.addFlashAttribute("successMessage", "Tạo product thành công!");
            } else {
                ra.addFlashAttribute("errorMessage", "Tạo product thất bại!");
            }
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "Lỗi tạo product: " + e.getMessage());
        }
        return "redirect:/products";
    }

    @PostMapping("/update/{id}")
    public String update(@PathVariable("id") Long id, @ModelAttribute Product product, RedirectAttributes ra) {
        try {
            Product updated = productService.updateProduct(id, product);
            if (updated != null) {
                ra.addFlashAttribute("successMessage", "Cập nhật product thành công!");
            } else {
                ra.addFlashAttribute("errorMessage", "Cập nhật product thất bại!");
            }
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "Lỗi cập nhật product: " + e.getMessage());
        }
        return "redirect:/products";
    }

    @GetMapping("/delete/{id}")
    public String delete(@PathVariable("id") Long id, RedirectAttributes ra) {
        try {
            productService.deleteProduct(id);
            ra.addFlashAttribute("successMessage", "Xóa product thành công!");
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "Lỗi xóa product: " + e.getMessage());
        }
        return "redirect:/products";
    }
}


