package com.example.learnspring1.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.learnspring1.domain.Category;

public interface CategoryService {
    Category createCategory(Category category);

    Page<Category> getCategoriesPage(Pageable pageable, Specification<Category> spec);
    
    Page<Category> getCategoriesPage(Pageable pageable);
    
    Page<Category> getCategoriesPageWithFilters(Pageable pageable, String name, Boolean isActive, String search);
    
    List<Category> getCategoriesWithFilters(String name, Boolean isActive);

    Optional<Category> getCategoryById(Long id);

    Category getCategoryByName(String name);

    Category updateCategory(Long id, Category category);

    void deleteCategory(Long id);
}

