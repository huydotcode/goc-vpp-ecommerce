package www.java.client.controller;

import www.java.client.annotation.RequireAdmin;
import www.java.client.model.Promotion;
import www.java.client.model.PaginatedResponse;
import www.java.client.service.PromotionService;

import java.util.ArrayList;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/promotions")
@RequireAdmin
public class PromotionController {

    private static final int MIN_PAGE_SIZE = 5;
    private static final int MAX_PAGE_SIZE = 100;

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @GetMapping
    public String listPromotions(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sort", defaultValue = "id") String sort,
            @RequestParam(value = "direction", defaultValue = "asc") String direction,
            @RequestParam(value = "id", required = false) String id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "search", required = false) String search,
            Model model) {

        page = Math.max(1, page);
        size = Math.min(Math.max(MIN_PAGE_SIZE, size), MAX_PAGE_SIZE);
        direction = "desc".equalsIgnoreCase(direction) ? "desc" : "asc";

        PaginatedResponse<Promotion> paginatedResponse = promotionService.getPromotionsWithPagination(
            page, size, sort, direction, id, name, isActive, search);

        if (paginatedResponse == null || paginatedResponse.getResult() == null) {
            paginatedResponse = new PaginatedResponse<>();
            paginatedResponse.setResult(new ArrayList<>());
        }

        PaginatedResponse.Metadata metadata = paginatedResponse.getMetadata();
        int currentPage = metadata != null ? metadata.getPage() : page;
        int totalPages = metadata != null ? metadata.getTotalPages() : 1;
        long totalElements = metadata != null ? metadata.getTotalElements() : 0;

        boolean hasNext = currentPage < totalPages;
        boolean hasPrev = currentPage > 1;

        model.addAttribute("promotions", paginatedResponse.getResult());
        model.addAttribute("currentPage", currentPage);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("totalElements", totalElements);
        model.addAttribute("hasNext", hasNext);
        model.addAttribute("hasPrev", hasPrev);
        model.addAttribute("sort", sort);
        model.addAttribute("direction", direction);
        model.addAttribute("id", id);
        model.addAttribute("name", name);
        model.addAttribute("isActive", isActive);
        model.addAttribute("search", search);
        model.addAttribute("size", size);

        return "promotions/list-admin";
    }
}

