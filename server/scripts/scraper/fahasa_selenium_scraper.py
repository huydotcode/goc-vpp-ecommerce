"""
Script để scrape products từ Fahasa.com sử dụng Selenium
Bypass 403 bằng cách giả lập browser thật
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.edge.options import Options
from bs4 import BeautifulSoup
import json
import re
import time
import os
from urllib.parse import urljoin
import random
from difflib import SequenceMatcher

class FahasaSeleniumScraper:
    def __init__(self, base_url="https://www.fahasa.com", headless=True):
        self.base_url = base_url
        self.products = []
        self.product_groups = {}  # Group products by base name
        self.sku_counter = 0
        self.seen_product_names = set()
        self.headless = headless
        self.driver = None
        
    def init_driver(self):
        """Khởi tạo Edge driver với options tối ưu"""
        print("[*] Initializing Edge driver...")
        
        edge_options = Options()
        
        # Headless mode (chạy ngầm, không hiện cửa sổ browser)
        if self.headless:
            edge_options.add_argument('--headless=new')
        
        # Anti-detection options
        edge_options.add_argument('--disable-blink-features=AutomationControlled')
        edge_options.add_argument('--disable-dev-shm-usage')
        edge_options.add_argument('--no-sandbox')
        edge_options.add_argument('--disable-gpu')
        edge_options.add_argument('--window-size=1920,1080')
        edge_options.add_argument('--start-maximized')
        
        # User agent
        edge_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0')
        
        # Additional options
        edge_options.add_experimental_option('excludeSwitches', ['enable-automation'])
        edge_options.add_experimental_option('useAutomationExtension', False)
        
        # Khởi tạo driver (Edge driver tự động được quản lý bởi Selenium 4.6+)
        try:
            self.driver = webdriver.Edge(options=edge_options)
        except Exception as e:
            print(f"[ERROR] Failed to initialize Edge: {e}")
            print("[*] Trying to use system Edge driver...")
            # Fallback: try without service
            self.driver = webdriver.Edge(options=edge_options)
        
        # Override navigator.webdriver
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        print("[OK] Edge driver initialized successfully")
    
    def close_driver(self):
        """Đóng browser"""
        if self.driver:
            self.driver.quit()
            print("[*] Browser closed")
    
    def load_category_mapping(self):
        """Load mapping từ database categories"""
        return {
            # Bút - Viết (parent: 100)
            '279': 100, '6212': 101, '6203': 102, '6200': 103, '6207': 104,
            '6208': 105, '6213': 106, '6199': 107, '6219': 108, '6214': 109,
            '6217': 110, '6229': 111,
            
            # Sản phẩm về giấy (parent: 112)
            '96': 112, '6319': 113, '6309': 114, '6318': 115, '6478': 116,
            '6381': 117, '6317': 118, '6313': 119, '6314': 120, '6322': 121,
            '6310': 122, '6320': 123, '6312': 124, '6330': 125, '6482': 126,
            '6311': 127, '6759': 128,
            
            # Dụng cụ học sinh (parent: 129)
            '94': 129, '3108': 130, '268': 131, '269': 132, '3153': 133,
            '7038': 134, '6148': 135, '281': 136, '3156': 137, '6150': 138,
            '3151': 139, '6474': 140, '6237': 141, '7037': 142,
            
            # Dụng Cụ Vẽ (parent: 143)
            '6221': 143, '6222': 144, '6227': 145, '6228': 146, '6226': 147,
            '6232': 148, '6294': 149,
            
            # Sản Phẩm VPP Khác (parent: 150)
            '6281': 150, '6282': 151, '6285': 152, '6284': 153, '6283': 154,
            '6475': 155, '6473': 156, '7047': 157,
            
            # Dụng cụ văn phòng (parent: 158)
            '95': 158, '6261': 159, '240': 160, '6145': 161, '6147': 162,
            '5965': 163, '241': 164,
            
            # Lịch Agenda (parent: 165)
            '6523': 165, '6525': 166, '6526': 167, '6524': 168, '6527': 169,
            
            # Sản Phẩm Điện Tử (parent: 170)
            '6298': 170, '6299': 171,
            
            # Thiệp (parent: 172)
            '6529': 172,
        }
    
    def parse_price(self, price_text):
        """Parse giá từ text: '24.000 đ' -> 24000"""
        if not price_text:
            return None
        price_clean = re.sub(r'[^\d]', '', price_text)
        try:
            return float(price_clean) if price_clean else None
        except:
            return None
    
    def calculate_similarity(self, str1, str2):
        """Tính độ tương đồng giữa 2 chuỗi (0.0 - 1.0)"""
        return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()
    
    def is_similar_to_existing(self, product_name, base_name, threshold=0.5):
        """
        Kiểm tra xem product có quá giống với sản phẩm đã tồn tại không
        - Nếu đã khớp variant pattern (có base_name khác tên gốc) -> cho phép (return False)
        - Nếu chưa khớp pattern -> check similarity với các base names đã có
        
        Returns:
            (is_similar, similar_to_base): (True/False, base_name_giống_nhất)
        """
        # Nếu đã tách được variant (base_name khác product_name), cho phép
        if base_name != product_name:
            return False, None
        
        # Chưa tách được variant, check similarity với các products đã có
        normalized_name = product_name.lower().strip()
        
        for existing_base_normalized, group_data in self.product_groups.items():
            existing_base = group_data['base_name']
            
            # Tính similarity
            similarity = self.calculate_similarity(product_name, existing_base)
            
            # Nếu similarity > threshold, coi là trùng
            if similarity >= threshold:
                return True, existing_base
        
        return False, None
    
    def extract_base_name_and_variant(self, product_name):
        """
        Tách tên sản phẩm thành base name và variant info
        
        Ví dụ:
        "Bút Bi Acroball 0.5 mm - Pilot BAB-15-OWB - Mực Đen - Thân Trắng"
        -> base: "Bút Bi Acroball 0.5 mm - Pilot BAB-15-OWB"
        -> variant: {"color": "Mực Đen - Thân Trắng"}
        
        "Bút Bic Bấm 10 Ngòi 10 Màu Axolotls 0.7 mm - Zhile ZL-1000 - Thân Màu Hồng"
        -> base: "Bút Bic Bấm 10 Ngòi 10 Màu Axolotls 0.7 mm - Zhile ZL-1000"
        -> variant: {"color": "Thân Màu Hồng"}
        """
        # Patterns để nhận diện variant info (thường ở cuối tên)
        variant_patterns = [
            r'\s*-\s*(Thân\s+(?:Màu\s+)?[\w\s]+)$',  # Thân Màu Hồng, Thân Trắng
            r'\s*-\s*(Mực\s+[\w\s]+\s*-\s*Thân\s+[\w\s]+)$',  # Mực Đen - Thân Trắng
            r'\s*-\s*(Màu\s+[\w\s]+)$',  # Màu Xanh
            r'\s*-\s*([\w\s]+(?:Xanh|Đỏ|Vàng|Hồng|Tím|Cam|Nâu|Đen|Trắng|Xám))$',  # Kết thúc bằng màu
            r'\s*-\s*(\d+\s*mm\s*-\s*[\w\s]+)$',  # 0.5 mm - Màu Xanh
        ]
        
        base_name = product_name
        variant_value = None
        variant_type = 'COLOR'
        
        for pattern in variant_patterns:
            match = re.search(pattern, product_name)
            if match:
                variant_value = match.group(1).strip()
                base_name = product_name[:match.start()].strip()
                break
        
        # Nếu không tìm thấy variant pattern, coi toàn bộ là base name
        if not variant_value:
            variant_value = 'Mặc định'
            variant_type = 'OTHER'
        
        return base_name, variant_value, variant_type
    
    def scrape_page(self, url, category_id):
        """Scrape một trang products sử dụng Selenium"""
        try:
            print(f"  [*] Loading: {url}")
            
            # Load trang
            self.driver.get(url)
            
            # Đợi trang load xong (body element)
            try:
                WebDriverWait(self.driver, 15).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
            except:
                pass
            
            # Đợi thêm để đảm bảo JS chạy xong
            time.sleep(3)
            
            # Scroll xuống để load lazy images
            try:
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
                time.sleep(1)
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)
                self.driver.execute_script("window.scrollTo(0, 0);")
                time.sleep(1)
            except:
                pass
            
            # Đợi cho products load (tối đa 15 giây)
            try:
                WebDriverWait(self.driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "ul#products_grid li, div.product-item"))
                )
                print("  [OK] Products found")
            except:
                print("  [WARN] Timeout waiting for products, trying to parse anyway...")
            
            # Lấy HTML và parse bằng BeautifulSoup
            html = self.driver.page_source
            soup = BeautifulSoup(html, 'html.parser')
            
            # Parse products
            product_items = soup.select('ul#products_grid > li')
            
            if not product_items:
                product_items = soup.select('div.product-item, li.item')
            
            print(f"  [*] Found {len(product_items)} products")
            
            if len(product_items) == 0:
                # Debug: save HTML
                debug_file = os.path.join(os.path.dirname(__file__), 'debug_selenium_page.html')
                with open(debug_file, 'w', encoding='utf-8') as f:
                    f.write(html)
                print(f"  [WARN] No products found. Saved HTML to {debug_file}")
            
            added_count = 0
            duplicate_count = 0
            similar_skip_count = 0
            
            for item in product_items:
                try:
                    product = {
                        'name': '',
                        'price': None,
                        'discount_price': None,
                        'sku': '',
                        'brand': 'Fahasa',
                        'image_url': '',
                        'product_url': '',
                        'category_id': category_id
                    }
                    
                    # Product name và URL
                    name_elem = item.select_one('h2.product-name-no-ellipsis a, h2.product-name a, a.product-name')
                    if name_elem:
                        product['name'] = name_elem.get('title', '').strip() or name_elem.get_text(strip=True)
                        product['product_url'] = name_elem.get('href', '')
                        if product['product_url']:
                            product['product_url'] = urljoin(self.base_url, product['product_url'])
                    
                    # Image - Lấy ảnh sản phẩm thật, bỏ qua frame/logo
                    product_image_container = item.select_one('div.product-image, span.product-image')
                    if product_image_container:
                        # Lấy tất cả img tags
                        all_imgs = product_image_container.select('img')
                        
                        # Tìm ảnh sản phẩm (không phải frame)
                        product_img = None
                        for img in all_imgs:
                            img_class = img.get('class', [])
                            img_src = img.get('src') or img.get('data-src') or img.get('data-lazy-src') or ''
                            
                            # Bỏ qua ảnh frame/logo
                            if 'fhs_img_frame_block' in img_class:
                                continue
                            if 'Frame' in img_src or 'frame' in img_src:
                                continue
                            if 'logo' in img_src.lower():
                                continue
                            
                            # Đây là ảnh sản phẩm thật
                            product_img = img_src
                            break
                        
                        # Nếu không tìm thấy, fallback về ảnh đầu tiên
                        if not product_img and all_imgs:
                            product_img = all_imgs[0].get('src') or all_imgs[0].get('data-src') or all_imgs[0].get('data-lazy-src')
                        
                        if product_img:
                            if product_img.startswith('//'):
                                product_img = 'https:' + product_img
                            elif not product_img.startswith('http'):
                                product_img = urljoin(self.base_url, product_img)
                            product['image_url'] = product_img
                    
                    # Price - special price (giá khuyến mãi)
                    special_price_elem = item.select_one('p.special-price span.price, span.special-price')
                    if special_price_elem:
                        product['price'] = self.parse_price(special_price_elem.get_text(strip=True))
                    
                    # Old price (giá gốc)
                    old_price_elem = item.select_one('p.old-price span.price, span.old-price')
                    if old_price_elem:
                        product['discount_price'] = self.parse_price(old_price_elem.get_text(strip=True))
                    
                    # Nếu không có special price, lấy price từ span.price đầu tiên
                    if not product['price']:
                        price_elem = item.select_one('span.price, div.price')
                        if price_elem:
                            product['price'] = self.parse_price(price_elem.get_text(strip=True))
                    
                    # Validate
                    if not product['name'] or not product['price']:
                        continue
                    
                    # Tách base name và variant
                    base_name, variant_value, variant_type = self.extract_base_name_and_variant(product['name'])
                    
                    # Check similarity với products đã có (threshold 50%)
                    is_similar, similar_base = self.is_similar_to_existing(product['name'], base_name, threshold=0.5)
                    if is_similar:
                        similar_skip_count += 1
                        print(f"    [SKIP-SIMILAR] {product['name'][:50]}... (>50% giống '{similar_base[:40]}...')")
                        continue
                    
                    # Normalize base name để group
                    normalized_base = base_name.lower().strip()
                    
                    # Check duplicate exact name
                    normalized_full_name = product['name'].lower().strip()
                    if normalized_full_name in self.seen_product_names:
                        duplicate_count += 1
                        continue
                    
                    # Add to product groups
                    if normalized_base not in self.product_groups:
                        self.product_groups[normalized_base] = {
                            'base_name': base_name,
                            'category_id': category_id,
                            'variants': []
                        }
                    
                    # Add variant to group
                    self.product_groups[normalized_base]['variants'].append({
                        'full_name': product['name'],
                        'variant_type': variant_type,
                        'variant_value': variant_value,
                        'price': product['price'],
                        'discount_price': product['discount_price'],
                        'image_url': product['image_url'],
                        'product_url': product['product_url']
                    })
                    
                    self.seen_product_names.add(normalized_full_name)
                    added_count += 1
                    
                    print(f"    [+] {base_name[:50]}... [{variant_value}] - {product['price']:,.0f}d")
                
                except Exception as e:
                    print(f"    [ERROR] Error parsing product: {e}")
                    continue
            
            if duplicate_count > 0:
                print(f"  [*] Skipped {duplicate_count} duplicate names")
            if similar_skip_count > 0:
                print(f"  [*] Skipped {similar_skip_count} similar products (>50% similarity)")
            print(f"  [*] Added {added_count} new products")
            
            return len(product_items)
        
        except Exception as e:
            print(f"  [ERROR] Error scraping page: {e}")
            return 0
    
    def scrape_category(self, category_url, category_id, max_pages=3):
        """Scrape một category với nhiều trang"""
        print(f"\n{'='*60}")
        print(f"[*] Category ID: {category_id}")
        print(f"[*] Base URL: {category_url}")
        print(f"[*] Max pages: {max_pages}")
        print(f"{'='*60}")
        
        page = 1
        while page <= max_pages:
            # Build URL với page number
            if '?' in category_url:
                url = f"{category_url}&p={page}"
            else:
                url = f"{category_url}?p={page}"
            
            count = self.scrape_page(url, category_id)
            
            if count == 0:
                print(f"  [WARN] No products found on page {page}, stopping")
                break
            
            page += 1
            if page <= max_pages:
                delay = random.uniform(2, 4)
                print(f"  [*] Waiting {delay:.1f}s before next page...")
                time.sleep(delay)
    
    def save_to_json(self, product_groups, filename):
        """Save to JSON với cấu trúc product + variants"""
        output = []
        for normalized_base, group_data in product_groups.items():
            output.append({
                'base_name': group_data['base_name'],
                'category_id': group_data['category_id'],
                'variants': group_data['variants']
            })
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        total_products = len(product_groups)
        total_variants = sum(len(g['variants']) for g in product_groups.values())
        print(f"[OK] Saved {total_products} products ({total_variants} variants) to {filename}")
    
    def save_to_sql(self, product_groups, filename):
        """Generate SQL INSERT statements với cấu trúc product + variants"""
        
        def escape_sql(s):
            if s is None or s == '':
                return 'NULL'
            return "'" + str(s).replace("'", "''").replace("\\", "\\\\") + "'"
        
        total_products = len(product_groups)
        total_variants = sum(len(g['variants']) for g in product_groups.values())
        
        sql_lines = [
            "-- ============================================================================",
            f"-- Fahasa Products Data (Scraped with Selenium - Grouped Variants)",
            f"-- Total products: {total_products}",
            f"-- Total variants: {total_variants}",
            "-- ============================================================================",
            "",
            "SET @created_by = 'system';",
            ""
        ]
        
        product_idx = 0
        for normalized_base, group_data in product_groups.items():
            product_idx += 1
            base_name = group_data['base_name']
            category_id = group_data['category_id']
            variants = group_data['variants']
            
            # Generate SKU cho product
            self.sku_counter += 1
            product_sku = f"FHS{self.sku_counter:06d}"
            
            # Lấy thông tin từ variant đầu tiên (default)
            default_variant = variants[0]
            product_price = default_variant['price']
            product_discount = default_variant.get('discount_price')
            product_thumbnail = default_variant.get('image_url')
            
            sql_lines.append(f"-- Product {product_idx}: {base_name[:60]}")
            sql_lines.append(f"-- Variants: {len(variants)}")
            
            # Insert product
            name = escape_sql(base_name)
            desc = escape_sql('')
            discount_price = 'NULL' if not product_discount else f"{product_discount:.4f}"
            sku = escape_sql(product_sku)
            brand = escape_sql('Fahasa')
            thumbnail = escape_sql(product_thumbnail)
            
            sql_lines.append("INSERT INTO products (")
            sql_lines.append("    name, description, price, discount_price, sku, brand,")
            sql_lines.append("    thumbnail_url, is_active, is_featured,")
            sql_lines.append("    created_at, updated_at, created_by, updated_by, deleted_by")
            sql_lines.append(") VALUES (")
            sql_lines.append(f"    {name}, {desc}, {product_price:.4f}, {discount_price}, {sku}, {brand},")
            sql_lines.append(f"    {thumbnail}, TRUE, FALSE,")
            sql_lines.append(f"    NOW(), NOW(), @created_by, NULL, NULL")
            sql_lines.append(");")
            sql_lines.append(f"SET @product{product_idx}_id = LAST_INSERT_ID();")
            sql_lines.append("")
            
            # Link to category
            sql_lines.append(f"INSERT INTO product_categories (product_id, category_id) VALUES (@product{product_idx}_id, {category_id});")
            sql_lines.append("")
            
            # Insert variants
            for vidx, variant in enumerate(variants, 1):
                self.sku_counter += 1
                variant_sku = f"FHS{self.sku_counter:06d}"
                variant_price = variant['price']
                variant_type = variant['variant_type']
                variant_value = escape_sql(variant['variant_value'])
                variant_image = escape_sql(variant.get('image_url'))
                is_default = 'TRUE' if vidx == 1 else 'FALSE'
                
                sql_lines.append(f"-- Variant {vidx}: {variant['variant_value']}")
                sql_lines.append("INSERT INTO product_variants (")
                sql_lines.append("    product_id, variant_type, variant_value, color_code, image_url,")
                sql_lines.append("    price, stock_quantity, sku, sort_order, is_default, is_active,")
                sql_lines.append("    created_at, updated_at, created_by, updated_by, deleted_by")
                sql_lines.append(") VALUES (")
                sql_lines.append(f"    @product{product_idx}_id, '{variant_type}', {variant_value}, NULL, {variant_image},")
                sql_lines.append(f"    {variant_price:.4f}, 100, '{variant_sku}', {vidx}, {is_default}, TRUE,")
                sql_lines.append(f"    NOW(), NOW(), @created_by, NULL, NULL")
                sql_lines.append(");")
                sql_lines.append("")
            
            # Insert product images (từ các variants)
            image_idx = 0
            seen_images = set()
            for variant in variants:
                img_url = variant.get('image_url')
                if img_url and img_url not in seen_images:
                    image_idx += 1
                    seen_images.add(img_url)
                    img_escaped = escape_sql(img_url)
                    is_primary = 'TRUE' if image_idx == 1 else 'FALSE'
                    
                    sql_lines.append("INSERT INTO product_images (")
                    sql_lines.append("    product_id, image_url, sort_order, is_primary,")
                    sql_lines.append("    created_at, updated_at, created_by, updated_by, deleted_by")
                    sql_lines.append(") VALUES (")
                    sql_lines.append(f"    @product{product_idx}_id, {img_escaped}, {image_idx}, {is_primary},")
                    sql_lines.append(f"    NOW(), NOW(), @created_by, NULL, NULL")
                    sql_lines.append(");")
                    sql_lines.append("")
            
            sql_lines.append("")
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sql_lines))
        
        print(f"[OK] Generated SQL file: {filename}")


# ============================================================================
# CẤU HÌNH - Paste URL và cấu hình ở đây
# ============================================================================

if __name__ == '__main__':
    # Khởi tạo scraper
    # headless=False để xem browser chạy (debug), headless=True để chạy ngầm (nhanh hơn)
    scraper = FahasaSeleniumScraper(headless=True)
    
    try:
        # Khởi tạo browser
        scraper.init_driver()
        
        # Load category mapping
        category_mapping = scraper.load_category_mapping()
        
        # Cấu hình URLs để scrape
        scrape_config = [
            # ========== BÚT - VIẾT (100-111) ==========
            {
                'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-gel-but-nuoc-ruot-but-gel.html?order=created_at&limit=24',
                'max_pages': 3,
                'category_id': 101  # Bút Gel - Bút Nước - Ruột Bút Gel
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-chi-ruot-but-chi.html?order=created_at&limit=24',
                'max_pages': 3,
                'category_id': 102  # Bút Chì - Ruột Bút Chì
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-bi-ruot-but-bi.html?order=created_at&limit=24',
                'max_pages': 3,
                'category_id': 103  # Bút Bi - Ruột Bút Bi
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-long.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 104  # Bút Lông
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-da-quang.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 105  # Bút Dạ Quang
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-ky-thuat.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 106  # Bút Kỹ Thuật
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-muc-but-may.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 107  # Bút Mực - Bút Máy
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-cao-cap.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 108  # Bút Cao Cấp
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-thu-phap.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 109  # Bút Thư Pháp
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-son.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 110  # Bút Sơn
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-ky.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 111  # Bút Ký
            },

            # ========== SẢN PHẨM VỀ GIẤY (112-128) ==========
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/so-tay-cac-loai.html?order=created_at&limit=24',
                'max_pages': 3,
                'category_id': 113  # Sổ Các Loại
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/tap-vo.html?order=created_at&limit=24',
                'max_pages': 3,
                'category_id': 114  # Tập - Vở
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/giay-note.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 115  # Giấy Note
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/cac-loai-giay-khac.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 116  # Các Loại Giấy Khác
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/sticker.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 117  # Sticker
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/nhan-vo-nhan-ten.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 118  # Nhãn Vở - Nhãn Tên
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/giay-thu-cong-giay-mau.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 119  # Giấy Thủ Công - Giấy Màu
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/giay-kiem-tra.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 120  # Giấy Kiểm Tra
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/danh-dau-trang-giay-phan-trang.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 121  # Đánh Dấu Trang - Giấy Phân Trang
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/giay-ke-tay.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 122  # Giấy Kê Tay
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/giay-photo.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 123  # Giấy Photo
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/tap-chep-nhac.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 124  # Tập Chép Nhạc
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/flash-card.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 125  # Flash Card
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/giay-bia.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 126  # Giấy Bìa
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/thoi-khoa-bieu.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 127  # Thời Khóa Biểu
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-ve-giay/bao-li-xi.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 128  # Bao Lì Xì
            },

            # ========== DỤNG CỤ HỌC SINH (129-142) ==========
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/gom-tay.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 130  # Gôm - tẩy
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/bop-viet-hop-but.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 131  # Bóp Viết - Hộp Bút
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/got-but-chi.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 132  # Gọt Bút Chì
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/thuoc.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 133  # Thước
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/ba-lo.html?order=created_at&limit=24',
                'max_pages': 3,
                'category_id': 134  # Ba Lô
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/bao-tap-bao-sach.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 135  # Bao Tập - Bao Sách
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/bang-viet-bong-lau-bang.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 136  # Bảng Viết - Bông Lau Bảng
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/compa.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 137  # Compa
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/bo-dung-cu-hoc-tap.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 138  # Bộ Dụng Cụ Học Tập
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/muc.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 139  # Mực
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/dung-cu-hoc-sinh-khac.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 140  # Dụng Cụ Học Sinh Khác
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/phan-hop-dung-phan.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 141  # Phấn - Hộp Đựng Phấn
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh/cap.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 142  # Cặp
            },

            # ========== DỤNG CỤ VẼ (143-149) ==========
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-ve/but-ve.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 144  # Bút Vẽ
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-ve/mau-ve.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 145  # Màu Vẽ
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-ve/tap-ve-giay-ve.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 146  # Tập Vẽ - Giấy Vẽ
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-ve/khay-co-ve.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 147  # Khay - Cọ Vẽ
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-ve/bo-ve-sang-tao.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 148  # Bộ Vẽ Sáng Tạo
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-ve/gia-ve-khung-ve.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 149  # Giá Vẽ - Khung Vẽ
            },

            # ========== SẢN PHẨM VPP KHÁC (150-157) ==========
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-vpp-khac/dao-roc-giay-luoi-dao-roc-giay-keo.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 151  # Dao Rọc Giấy - Lưỡi Dao Rọc Giấy - Kéo
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-vpp-khac/but-xoa-nuoc-xoa-keo.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 152  # Bút Xóa Nước - Xóa Kéo
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-vpp-khac/keo-kho-ho-dan.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 153  # Keo Khô - Hồ Dán
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-vpp-khac/bang-keo-cat-bang-keo.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 154  # Băng Keo - Cắt Băng Keo
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-vpp-khac/day-deo-bang-ten.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 155  # Dây Đeo - Bảng Tên
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-vpp-khac/van-phong-pham-khac.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 156  # Văn Phòng Phẩm Khác
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-vpp-khac/qua-dia-cau.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 157  # Quả Địa Cầu
            },

            # ========== DỤNG CỤ VĂN PHÒNG (158-164) ==========
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-van-phong/bia-file-ho-so.html?order=created_at&limit=24',
                'max_pages': 3,
                'category_id': 159  # Bìa - File Hồ Sơ
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-van-phong/do-bam-kim-kim-bam-go-kim-kim-kep.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 160  # Đồ Bấm Kim - Kim Bấm - Gỡ Kim - Kim Kẹp
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-van-phong/kep-giay-kep-buom-kep-cac-loai.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 161  # Kẹp Giấy - Kẹp Bướm - Kẹp Các Loại
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-van-phong/cam-but.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 162  # Cắm Bút
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-van-phong/muc-dau-con-dau-tam-bong.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 163  # Mực Dấu - Con Dấu - Tăm Bông
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/dung-cu-van-phong/duc-lo-may-bam-gia.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 164  # Đục Lỗ - Máy bấm giá
            },

            # ========== LỊCH AGENDA (165-169) ==========
            {
                'url': 'https://www.fahasa.com/van-phong-pham/lich-agenda/lich-bloc.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 166  # Lịch bloc
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/lich-agenda/lich-ban.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 167  # Lịch bàn
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/lich-agenda/lich-to-lich-lo-xo.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 168  # Lịch Tờ, Lịch Lò Xo
            },
            {
                'url': 'https://www.fahasa.com/van-phong-pham/lich-agenda/lich-khac.html?order=created_at&limit=24',
                'max_pages': 1,
                'category_id': 169  # Lịch khác
            },

            # ========== SẢN PHẨM ĐIỆN TỬ (170-171) ==========
            {
                'url': 'https://www.fahasa.com/van-phong-pham/san-pham-dien-tu/may-tinh-dien-tu.html?order=created_at&limit=24',
                'max_pages': 3,
                'category_id': 171  # Máy tính điện tử
            },

            # ========== THIỆP (172) ==========
            {
                'url': 'https://www.fahasa.com/van-phong-pham/thiep.html?order=created_at&limit=24',
                'max_pages': 2,
                'category_id': 172  # Thiệp
            },
        ]
        
        print("=" * 60)
        print("FAHASA PRODUCT SCRAPER (SELENIUM)")
        print("=" * 60)
        print(f"[*] Total categories to scrape: {len(scrape_config)}")
        print(f"[*] Starting SKU: FHS000001")
        print()
        
        # Scrape từng category
        for idx, config in enumerate(scrape_config, 1):
            print(f"\n[{idx}/{len(scrape_config)}] Starting category {config['category_id']}")
            scraper.scrape_category(
                config['url'],
                config['category_id'],
                config['max_pages']
            )
            
            if idx < len(scrape_config):
                delay = random.uniform(3, 5)
                print(f"\n[*] Waiting {delay:.1f}s before next category...")
                time.sleep(delay)
        
        # Save results
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        if scraper.product_groups:
            json_file = os.path.join(script_dir, 'fahasa_products_selenium.json')
            scraper.save_to_json(scraper.product_groups, json_file)
            
            sql_file = os.path.join(script_dir, 'fahasa_products_selenium_seed.sql')
            scraper.save_to_sql(scraper.product_groups, sql_file)
        
        # Summary
        total_products = len(scraper.product_groups)
        total_variants = sum(len(g['variants']) for g in scraper.product_groups.values())
        
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"[OK] Total unique products: {total_products}")
        print(f"[*] Total variants: {total_variants}")
        print(f"[*] Last SKU: FHS{scraper.sku_counter:06d}")
        print(f"[*] Total scraped items: {len(scraper.seen_product_names)}")
        print("\n[OK] Done!")
    
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Đóng browser
        scraper.close_driver()

