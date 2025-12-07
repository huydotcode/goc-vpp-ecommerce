package com.example.learnspring1.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.example.learnspring1.domain.Category;
import com.example.learnspring1.domain.dto.CategoryDTO;
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

        // Validate parent nếu có
        if (category.getParent() != null && category.getParent().getId() != null) {
            Category parent = categoryRepository.findById(category.getParent().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent category không tồn tại"));

            // Kiểm tra circular reference (không cho phép parent là chính nó)
            if (category.getId() != null && parent.getId().equals(category.getId())) {
                throw new IllegalArgumentException("Category không thể là parent của chính nó");
            }

            // Kiểm tra parent phải active
            if (parent.getIsActive() == null || !parent.getIsActive()) {
                throw new IllegalArgumentException("Parent category phải đang active");
            }

            category.setParent(parent);
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
    public Page<Category> getCategoriesPageWithFilters(Pageable pageable, Long id, String name, Boolean isActive,
            String search) {
        // If ID filter is provided, it takes ABSOLUTE priority - ignore all other
        // filters
        if (id != null) {
            return categoryRepository.findCategoriesByIdOnly(String.valueOf(id), pageable);
        }

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
            existing.setSortOrder(category.getSortOrder());

            // Validate và update parent
            if (category.getParent() != null && category.getParent().getId() != null) {
                // Kiểm tra circular reference
                if (category.getParent().getId().equals(id)) {
                    throw new IllegalArgumentException("Category không thể là parent của chính nó");
                }

                Category parent = categoryRepository.findById(category.getParent().getId())
                        .orElseThrow(() -> new IllegalArgumentException("Parent category không tồn tại"));

                // Kiểm tra không tạo circular reference trong tree
                if (isCircularReference(id, parent.getId())) {
                    throw new IllegalArgumentException("Không thể tạo circular reference trong category tree");
                }

                existing.setParent(parent);
            } else {
                existing.setParent(null);
            }

            return categoryRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Category not found with id " + id));
    }

    // Helper method để kiểm tra circular reference
    private boolean isCircularReference(Long categoryId, Long parentId) {
        Category parent = categoryRepository.findById(parentId).orElse(null);
        if (parent == null) {
            return false;
        }

        // Nếu parent có parent là categoryId thì là circular
        if (parent.getParent() != null && parent.getParent().getId().equals(categoryId)) {
            return true;
        }

        // Recursive check
        if (parent.getParent() != null) {
            return isCircularReference(categoryId, parent.getParent().getId());
        }

        return false;
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Category not found with id " + id));
        category.softDelete();
        categoryRepository.save(category);
    }

    @Override
    public List<CategoryDTO> getNestedCategories(Boolean isActive) {
        List<Category> rootCategories = categoryRepository.findRootCategories(isActive);
        return rootCategories.stream()
                .map(this::toNestedDTO)
                .collect(Collectors.toList());
    }

    private CategoryDTO toNestedDTO(Category category) {
        CategoryDTO dto = CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .thumbnailUrl(category.getThumbnailUrl())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .parentName(category.getParent() != null ? category.getParent().getName() : null)
                .sortOrder(category.getSortOrder())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .createdBy(category.getCreatedBy())
                .updatedBy(category.getUpdatedBy())
                .deletedBy(category.getDeletedBy())
                .build();

        // Recursively map children
        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            List<CategoryDTO> childrenDTOs = category.getChildren().stream()
                    .filter(child -> child.getIsActive() != null && child.getIsActive())
                    .filter(child -> child.getDeletedBy() == null)
                    .sorted(Comparator.comparing(Category::getSortOrder,
                            Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(Category::getName))
                    .map(this::toNestedDTO)
                    .collect(Collectors.toList());
            dto.setChildren(childrenDTOs);
        }

        return dto;
    }

    @Override
    public List<Long> getAllDescendantIds(Long categoryId) {
        List<Long> result = new ArrayList<>();
        result.add(categoryId); // Include the category itself

        // Get all children (active only)
        List<Category> children = categoryRepository.findChildrenByParentId(categoryId, true);
        for (Category child : children) {
            // Recursively get all descendants
            result.addAll(getAllDescendantIds(child.getId()));
        }

        return result;
    }
}
