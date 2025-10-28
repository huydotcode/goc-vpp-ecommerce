package com.example.learnspring1.service.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.example.learnspring1.domain.Category;
import com.example.learnspring1.repository.CategoryRepository;
import com.example.learnspring1.service.CategoryService;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public Category createCategory(Category category) {
        // Kiểm tra trùng tên
        if (categoryRepository.existsByName(category.getName())) {
            throw new IllegalArgumentException("Tên category đã tồn tại");
        }
        return categoryRepository.save(category);
    }

    @Override
    public Page<Category> getCategoriesPage(Pageable pageable, Specification<Category> spec) {
        return categoryRepository.findAll(spec, pageable);
    }
    
    @Override
    public Page<Category> getCategoriesPage(Pageable pageable) {
        return categoryRepository.findByIsActiveTrue(pageable);
    }
    
    @Override
    public Page<Category> getCategoriesPageWithFilters(Pageable pageable, String name, Boolean isActive, String search) {
        // Build dynamic query with filters
        return categoryRepository.findCategoriesWithFiltersPaged(name, isActive, search, pageable);
    }
    
    @Override
    public List<Category> getCategoriesWithFilters(String name, Boolean isActive) {
        return categoryRepository.findCategoriesWithFilters(name, isActive);
    }

    @Override
    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    @Override
    public Category getCategoryByName(String name) {
        Optional<Category> category = categoryRepository.findByName(name);
        if (category.isPresent()) {
            return category.get();
        }
        throw new RuntimeException("Category not found with name " + name);
    }

    @Override
    public Category updateCategory(Long id, Category category) {
        return categoryRepository.findById(id).map(existing -> {
            existing.setName(category.getName());
            existing.setThumbnailUrl(category.getThumbnailUrl());
            existing.setDescription(category.getDescription());
            existing.setIsActive(category.getIsActive());
            return categoryRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Category not found with id " + id));
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new java.util.NoSuchElementException("Category not found with id " + id));
        category.softDelete();
        categoryRepository.save(category);
    }
}

