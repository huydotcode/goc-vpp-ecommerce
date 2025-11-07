package www.java.client.controller;

import www.java.client.model.Product;
import www.java.client.model.PaginatedResponse;
import www.java.client.service.ProductService;
import www.java.client.service.TokenService;
import www.java.client.utils.JwtUtil;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class UserProductController {

    private final ProductService productService;
    private final TokenService tokenService;
    private final JwtUtil jwtUtil;

    public UserProductController(ProductService productService, TokenService tokenService, JwtUtil jwtUtil) {
        this.productService = productService;
        this.tokenService = tokenService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/shop")
    public String shop(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "12") int size,
            @RequestParam(value = "sort", defaultValue = "id") String sort,
            @RequestParam(value = "direction", defaultValue = "ASC") String direction,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "brand", required = false) String brand,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "search", required = false) String search,
            Model model,
            HttpServletRequest request) {

        // Nếu truy cập lần đầu không có query string, redirect sang URL mặc định
        if (request.getQueryString() == null || request.getQueryString().isBlank()) {
            return "redirect:/shop?page=1&size=12&sort=id&direction=ASC&isActive=true";
        }

        page = Math.max(1, page);
        size = Math.min(Math.max(12, size), 48);
        direction = "desc".equalsIgnoreCase(direction) ? "desc" : "asc";

        // Chỉ lấy sản phẩm active
        Boolean isActive = true;

        PaginatedResponse<Product> resp = productService.getProductsWithPagination(
            page, size, sort, direction, null, name, null, brand, categoryId, null, isActive, search
        );

        PaginatedResponse.Metadata m = resp != null ? resp.getMetadata() : null;
        int currentPage = m != null ? m.getPage() : page;
        int totalPages = m != null ? m.getTotalPages() : 1;
        long totalElements = m != null ? m.getTotalElements() : 0;

        model.addAttribute("products", resp != null && resp.getResult() != null ? resp.getResult() : new java.util.ArrayList<>());
        model.addAttribute("currentPage", currentPage);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("totalElements", totalElements);
        model.addAttribute("hasNext", currentPage < totalPages);
        model.addAttribute("hasPrev", currentPage > 1);
        model.addAttribute("sort", sort);
        model.addAttribute("direction", direction);
        model.addAttribute("name", name);
        model.addAttribute("brand", brand);
        model.addAttribute("categoryId", categoryId);
        model.addAttribute("search", search);
        model.addAttribute("size", size);

        // Lấy thông tin user từ token
        String token = tokenService.getToken();
        if (token != null && jwtUtil.isValidToken(token)) {
            boolean isAdmin = jwtUtil.isAdmin(token);
            model.addAttribute("isAdmin", isAdmin);
        } else {
            model.addAttribute("isAdmin", false);
        }

        return "client/shop";
    }

    @GetMapping("/client/home")
    public String home(Model model) {
        String token = tokenService.getToken();
        boolean isAdmin = token != null && jwtUtil.isValidToken(token) && jwtUtil.isAdmin(token);
        model.addAttribute("isAdmin", isAdmin);
        model.addAttribute("search", null);
        return "client/home";
    }

    @GetMapping("/shop/product/{id}")
    public String productDetail(@PathVariable("id") Long id, Model model) {
        try {
            Product product = productService.getProductById(id);
            if (product == null) {
                return "redirect:/shop?error=product_not_found";
            }
            
            // Lấy danh sách ảnh của sản phẩm
            java.util.List<www.java.client.model.ProductImage> images = productService.getProductImagesByProductId(id);
            
            // Lấy thông tin user từ token
            String token = tokenService.getToken();
            if (token != null && jwtUtil.isValidToken(token)) {
                boolean isAdmin = jwtUtil.isAdmin(token);
                model.addAttribute("isAdmin", isAdmin);
            } else {
                model.addAttribute("isAdmin", false);
            }
            
            model.addAttribute("product", product);
            model.addAttribute("images", images != null ? images : new java.util.ArrayList<>());
            return "client/product-detail";
        } catch (Exception e) {
            System.out.println("[UserProductController] Error getting product detail: " + e.getMessage());
            e.printStackTrace();
            return "redirect:/shop?error=product_not_found";
        }
    }

    @GetMapping("/shop/cart")
    public String cart(Model model) {
        // Lấy thông tin user từ token
        String token = tokenService.getToken();
        if (token != null && jwtUtil.isValidToken(token)) {
            boolean isAdmin = jwtUtil.isAdmin(token);
            model.addAttribute("isAdmin", isAdmin);
        } else {
            model.addAttribute("isAdmin", false);
        }
        return "client/cart";
    }
}

