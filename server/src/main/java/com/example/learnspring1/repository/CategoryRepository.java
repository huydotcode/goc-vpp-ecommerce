package com.example.learnspring1.repository;

import org.springframework.stereotype.Repository;
import com.example.learnspring1.domain.Category;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long>, JpaSpecificationExecutor<Category> {

       Optional<Category> findByName(String name);

       boolean existsByName(String name);

       // Filter by isActive
       List<Category> findByIsActiveTrue();

       Page<Category> findByIsActiveTrue(Pageable pageable);

       // Custom query for filtering (without pagination)
       @Query("SELECT c FROM Category c WHERE " +
                     "(:name IS NULL OR c.name LIKE %:name%) AND " +
                     "(:isActive IS NULL OR c.isActive = :isActive) AND " +
                     "(c.deletedBy IS NULL)")
       List<Category> findCategoriesWithFilters(@Param("name") String name,
                     @Param("isActive") Boolean isActive);

       // Custom query for filtering with pagination
       @Query("SELECT c FROM Category c WHERE " +
                     "(:name IS NULL OR c.name LIKE %:name%) AND " +
                     "(:isActive IS NULL OR c.isActive = :isActive) AND " +
                     "(:search IS NULL OR c.name LIKE %:search% OR CAST(c.id AS string) LIKE %:search%) AND " +
                     "(c.deletedBy IS NULL)")
       Page<Category> findCategoriesWithFiltersPaged(@Param("name") String name,
                     @Param("isActive") Boolean isActive,
                     @Param("search") String search,
                     Pageable pageable);

       // Absolute ID filter - only search by ID, ignoring all other filters
       @Query("SELECT c FROM Category c WHERE " +
                     "CAST(c.id AS string) LIKE %:id% AND " +
                     "(c.deletedBy IS NULL)")
       Page<Category> findCategoriesByIdOnly(@Param("id") String id, Pageable pageable);

       // Find root categories (no parent) with children fetched (only one level)
       @EntityGraph(attributePaths = { "children" })
       @Query("SELECT c FROM Category c WHERE c.parent IS NULL AND " +
                     "(:isActive IS NULL OR c.isActive = :isActive) AND " +
                     "(c.deletedBy IS NULL) ORDER BY c.sortOrder ASC, c.name ASC")
       List<Category> findRootCategories(@Param("isActive") Boolean isActive);

       // Find children of a category
       @Query("SELECT c FROM Category c WHERE c.parent.id = :parentId AND " +
                     "(:isActive IS NULL OR c.isActive = :isActive) AND " +
                     "(c.deletedBy IS NULL) ORDER BY c.sortOrder ASC, c.name ASC")
       List<Category> findChildrenByParentId(@Param("parentId") Long parentId,
                     @Param("isActive") Boolean isActive);

       // Check if category has children
       @Query("SELECT COUNT(c) > 0 FROM Category c WHERE c.parent.id = :parentId AND c.deletedBy IS NULL")
       boolean hasChildren(@Param("parentId") Long parentId);
}
