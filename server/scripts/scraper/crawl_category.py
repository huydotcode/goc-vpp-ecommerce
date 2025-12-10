"""
Script để parse HTML categories và tạo SQL INSERT
Chỉ parse từ các child categories, không có parent category
"""

from bs4 import BeautifulSoup
import os

def parse_parent_links(html_file):
    """Parse danh sách các link categories chính từ parent HTML"""
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    categories = []
    links = soup.select('#children-categories li a')
    
    for link in links:
        cat_id = link.get('cat_id')
        title = link.get('title')
        href = link.get('href')
        
        if cat_id and title:
            categories.append({
                'cat_id': cat_id,
                'name': title,
                'href': href
            })
    
    return categories

def parse_child_categories(html_file):
    """Parse child categories từ HTML file con"""
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    categories = []
    links = soup.select('#children-categories li a')
    
    for link in links:
        cat_id = link.get('cat_id')
        title = link.get('title')
        # Nếu có h3, lấy text từ h3
        h3 = link.find('h3')
        if h3:
            title = h3.get_text(strip=True)
        
        href = link.get('href')
        
        if cat_id and title:
            categories.append({
                'cat_id': cat_id,
                'name': title,
                'href': href
            })
    
    return categories

def generate_sql():
    """Generate SQL INSERT statements"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_dir = os.path.join(script_dir, 'html')
    
    # Parse các categories chính từ parent file
    parent_file = os.path.join(html_dir, 'category_parent.html')
    main_categories = parse_parent_links(parent_file)
    
    print(f"Found {len(main_categories)} main categories:\n")
    for cat in main_categories:
        print(f"  - {cat['name']} (cat_id: {cat['cat_id']})")
    print()
    
    # Mapping filename với parent category
    category_files = {
        'Bút - Viết': 'category_but_viet_child.html',
        'Sản phẩm về giấy': 'category_san_pham_giay_child.html',
        'Dụng cụ học sinh': 'category_dung_cu_hoc_sinh_child.html',
        'Dụng Cụ Vẽ': 'category_dung_cu_ve_child.html',
        'Sản Phẩm VPP Khác': 'category_san_pham_vpp_khac_child.html',
        'Dụng cụ văn phòng': 'category_dung_cu_van_phong.html',
        'Lịch Agenda': 'category_lich_acenda_child.html',
        'Sản Phẩm Điện Tử': 'category_san_pham_dien_tu.html',
    }
    
    all_categories = []
    
    # ID counter - bắt đầu từ 100
    category_id_counter = 100
    
    # Parse từng main category
    for idx, main_cat in enumerate(main_categories, 1):
        cat_name = main_cat['name']
        cat_id = main_cat['cat_id']
        
        # Thêm main category (level 1 - không có parent)
        main_category = {
            'id': category_id_counter,
            'name': cat_name,
            'parent_id': 'NULL',
            'fahasa_cat_id': cat_id,
            'sort_order': idx
        }
        all_categories.append(main_category)
        main_parent_id = category_id_counter
        category_id_counter += 1
        
        # Nếu có file con, parse các subcategories (level 2)
        if cat_name in category_files:
            child_file = os.path.join(html_dir, category_files[cat_name])
            if os.path.exists(child_file):
                subcategories = parse_child_categories(child_file)
                print(f"  {cat_name}: {len(subcategories)} subcategories")
                
                for sidx, subcat in enumerate(subcategories, 1):
                    subcat_category = {
                        'id': category_id_counter,
                        'name': subcat['name'],
                        'parent_id': main_parent_id,
                        'fahasa_cat_id': subcat['cat_id'],
                        'sort_order': sidx
                    }
                    all_categories.append(subcat_category)
                    category_id_counter += 1
            else:
                print(f"  {cat_name}: File not found ({category_files[cat_name]})")
        else:
            print(f"  {cat_name}: No child file (leaf category)")
    
    print(f"\n{'='*60}")
    print(f"Total categories: {len(all_categories)}")
    print(f"{'='*60}\n")
    
    # Generate SQL
    sql_lines = [
        "-- ============================================================================",
        "-- Categories data from Fahasa",
        f"-- Total categories: {len(all_categories)}",
        "-- Structure: Main categories (level 1) + Subcategories (level 2)",
        "-- ============================================================================",
        "",
        "SET @created_by = 'system';",
        ""
    ]
    
    for cat in all_categories:
        level = "Level 1 (Main)" if cat['parent_id'] == 'NULL' else "Level 2 (Sub)"
        sql_lines.append(f"-- {level}: {cat['name']} (ID: {cat['id']}, Parent: {cat['parent_id']})")
        sql_lines.append("INSERT INTO categories (")
        sql_lines.append("    id, name, description, is_active, parent_id, sort_order,")
        sql_lines.append("    created_at, updated_at, created_by, updated_by, deleted_by")
        sql_lines.append(") VALUES (")
        
        name = cat['name'].replace("'", "''")
        desc = f"Fahasa cat_id: {cat['fahasa_cat_id']}"
        desc = desc.replace("'", "''")
        
        sql_lines.append(f"    {cat['id']}, '{name}', '{desc}', TRUE, {cat['parent_id']}, {cat['sort_order']},")
        sql_lines.append(f"    NOW(), NOW(), @created_by, NULL, NULL")
        sql_lines.append(");")
        sql_lines.append("")
    
    # Write to file
    output_file = os.path.join(script_dir, 'fahasa_categories_seed.sql')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"✅ Generated SQL file: {output_file}")
    print(f"   Total categories: {len(all_categories)}")
    print(f"   Next available ID: {category_id_counter}")

if __name__ == '__main__':
    generate_sql()