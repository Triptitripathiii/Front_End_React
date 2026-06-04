import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { BASE_URL } from "../api/api";
import { 
  LogOut, 
  Search, 
  ShoppingBag, 
  Tag, 
  Box, 
  RefreshCw, 
  CheckCircle,
  Database,
  Laptop,
  Smartphone,
  Headphones,
  SlidersHorizontal,
  Minus,
  Plus
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
}

interface Product {
  _id?: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  brand: string;
  image?: string;
  imageUrl?: string;
}

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

// Mock inventory catalog prepopulated with exact MongoDB products from your database screenshot,
// plus high-resolution technology flatlays matching each item's mobile/laptop/accessory category!
const FALLBACK_PRODUCTS: Product[] = [
  {
    _id: "6a1839a9a61d2485a5ea7167",
    name: "iPhone 15",
    price: 80000,
    category: "Mobile",
    stock: 15,
    brand: "Apple",
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=500&auto=format&fit=crop"
  },
  {
    _id: "6a1839a9a61d2485a5ea7168",
    name: "Samsung Galaxy S24",
    price: 72000,
    category: "Mobile",
    stock: 12,
    brand: "Samsung",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=500&auto=format&fit=crop"
  },
  {
    _id: "6a1839a9a61d2485a5ea7169",
    name: "MacBook Pro M3 Max",
    price: 249999,
    category: "Laptop",
    stock: 8,
    brand: "Apple",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=500&auto=format&fit=crop"
  },
  {
    _id: "6a1839a9a61d2485a5ea7170",
    name: "Dell XPS 15",
    price: 185000,
    category: "Laptop",
    stock: 5,
    brand: "Dell",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=500&auto=format&fit=crop"
  },
  {
    _id: "6a1839a9a61d2485a5ea7171",
    name: "Sony WH-1000XM5",
    price: 29999,
    category: "Electronics",
    stock: 0,
    brand: "Sony",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500&auto=format&fit=crop"
  },
  {
    _id: "6a1839a9a61d2485a5ea7172",
    name: "iPad Air M2",
    price: 59900,
    category: "Mobile",
    stock: 22,
    brand: "Apple",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=500&auto=format&fit=crop"
  },
  {
    _id: "6a1839a9a61d2485a5ea7173",
    name: "Logitech MX Master 3S",
    price: 10999,
    category: "Accessories",
    stock: 45,
    brand: "Logitech",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=500&auto=format&fit=crop"
  },
  {
    _id: "6a1839a9a61d2485a5ea7174",
    name: "Apple Watch Series 9",
    price: 41900,
    category: "Electronics",
    stock: 3,
    brand: "Apple",
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=500&auto=format&fit=crop"
  }
];

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc" | "stock">("name");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Individual product selection quantities
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Confirm logout modal toggle
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setErrorDetails(null);

    try {
      console.log("Attempting to fetch products from endpoint `/api/products`...");
      let response = await axios.get(`${BASE_URL}/api/products`);
      let dataList = parseProductsResponse(response.data);
      
      if (dataList) {
        setProducts(dataList);
      } else {
        setProducts([]);
        setErrorDetails("Invalid products response format");
      }
    } catch (error: any) {
      console.warn("Fetch from `/api/products` failed. Retrying `/api/product`...", error.message);
      try {
        let response = await axios.get(`${BASE_URL}/api/product`);
        let dataList = parseProductsResponse(response.data);
        
        if (dataList) {
          setProducts(dataList);
        } else {
          setProducts([]);
          setErrorDetails("Invalid products response format");
        }
      } catch (innerError: any) {
        console.error("All product fetch attempts failed:", innerError);
        setProducts([]);
        setErrorDetails(innerError.response?.data?.message || innerError.message || "Failed to load products from API.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resilient response parser that handles backend naming quirks (like sending 'users', 'products', 'product', or 'Product')
  const parseProductsResponse = (data: any): Product[] | null => {
    if (!data) return null;
    if (Array.isArray(data.products)) return data.products;
    if (Array.isArray(data.product)) return data.product;
    if (Array.isArray(data.Product)) return data.Product;
    if (Array.isArray(data.Products)) return data.Products;
    if (Array.isArray(data.users)) {
      console.warn("Resiliency Triggered: Received products list under 'users' key.");
      return data.users;
    }
    if (Array.isArray(data)) return data;
    return null;
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute categories
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ["All", ...Array.from(list)];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || 
             p.brand.toLowerCase().includes(q) || 
             p.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "price-asc") {
        return a.price - b.price;
      } else if (sortBy === "price-desc") {
        return b.price - a.price;
      } else if (sortBy === "stock") {
        return b.stock - a.stock;
      }
      return 0;
    });

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Formatter for prices
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
  };

  // Helper icon for categories
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "mobile": return <Smartphone size={16} />;
      case "laptop": return <Laptop size={16} />;
      case "electronics": return <Headphones size={16} />;
      default: return <Tag size={16} />;
    }
  };

  // Quantity controllers
  const getQuantity = (id: string) => quantities[id] || 0;

  const handleIncrement = (id: string, stockLimit: number) => {
    if (stockLimit <= 0) return;
    setQuantities(prev => {
      const current = prev[id] || 0;
      if (current >= stockLimit) return prev;
      return { ...prev, [id]: current + 1 };
    });
  };

  const handleDecrement = (id: string) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      if (current <= 0) return prev;
      return { ...prev, [id]: current - 1 };
    });
  };

  return (
    <div style={{ flex: 1, padding: "30px", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
      {/* Top Navigation Bar with StoreHub brand aesthetic */}
      <header 
        className="glass-container fade-in" 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: "12px 24px", 
          marginBottom: "20px",
          gap: "20px",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          flexWrap: "wrap"
        }}
      >
        {/* COLUMN 1: Left - Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            fontFamily: "var(--font-display)",
            fontSize: "1.35rem",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#1c1c1e",
            flexShrink: 0
          }}
        >
          <span>STORE</span>
          <span
            style={{
              color: "white",
              background: "var(--accent-orange)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "1.15rem",
              display: "inline-block",
              marginLeft: "2px"
            }}
          >
            HUB
          </span>
        </div>

        {/* COLUMN 2: Center - Expanded Search Bar taking rest of empty space */}
        <div style={{ flex: 1, margin: "0 24px", position: "relative", maxWidth: "680px", minWidth: "200px" }}>
          <Search 
            size={16} 
            style={{ 
              position: "absolute", 
              left: "14px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "#b0b0b8",
              pointerEvents: "none"
            }} 
          />
          <input 
            type="text" 
            placeholder="Search catalog, brands, or categories..." 
            className="glass-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", paddingLeft: "38px", paddingRight: "14px", paddingTop: "8px", paddingBottom: "8px", borderRadius: "8px", border: "1px solid #e2e2e6", fontSize: "0.88rem" }}
          />
        </div>

        {/* COLUMN 3: Right - Profile/Logout Utilities */}
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "24px", 
            justifyContent: "flex-end",
            flexShrink: 0
          }}
        >
          {/* User profile actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div 
                style={{ 
                  width: "36px", 
                  height: "36px", 
                  borderRadius: "50%", 
                  background: "rgba(255, 90, 0, 0.08)",
                  border: "1px solid rgba(255, 90, 0, 0.15)",
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "var(--accent-orange)"
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: "none", flexDirection: "column" }} className="desktop-user-info">
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{user.name}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{user.email}</span>
              </div>
              {/* Inject custom styling to show user info on md/lg screens */}
              <style>{`
                @media (min-width: 768px) {
                  .desktop-user-info { display: flex !important; }
                }
              `}</style>
            </div>

            <button 
              onClick={() => setShowLogoutModal(true)} 
              className="glass-btn-secondary"
              style={{ 
                width: "36px", 
                height: "36px", 
                padding: 0, 
                borderRadius: "8px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                boxShadow: "none" 
              }}
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="fade-in" style={{ animationDelay: "0.1s" }}>

        {/* Filter Toolbar (Transparent Minimalist Row) */}
        <section 
          style={{ 
            padding: "4px 0px", 
            marginBottom: "16px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px", width: "100%", maxWidth: "70%" }} className="category-scroll">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: selectedCategory === cat 
                    ? "1px solid var(--accent-orange)" 
                    : "1px solid rgba(0,0,0,0.06)",
                  background: selectedCategory === cat 
                    ? "var(--accent-orange-glow)" 
                    : "#ffffff",
                  color: selectedCategory === cat ? "var(--accent-orange)" : "var(--text-secondary)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "auto" }}>
            <SlidersHorizontal size={12} style={{ color: "var(--text-muted)" }} />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                padding: "5px 10px",
                fontSize: "0.8rem",
                outline: "none",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              <option value="name">Sort by Name</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock">Highest Stock</option>
            </select>
          </div>
        </section>

        {/* Product Cards Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div 
              style={{ 
                width: "40px", 
                height: "40px", 
                border: "3px solid rgba(255, 90, 0, 0.08)", 
                borderTopColor: "var(--accent-orange)", 
                borderRadius: "50%", 
                animation: "spin 1s linear infinite",
                margin: "0 auto 15px auto"
              }} 
            />
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>Querying inventory catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div 
            className="glass-container" 
            style={{ 
              textAlign: "center", 
              padding: "80px 20px", 
              color: "var(--text-muted)",
              border: "1px solid rgba(0, 0, 0, 0.08)"
            }}
          >
            <Box size={44} style={{ marginBottom: "15px", color: "#d2d2d6" }} />
            <h3 style={{ color: "var(--text-primary)" }}>No Products Found</h3>
            <p style={{ fontSize: "0.88rem", marginTop: "5px" }}>
              Try adjusting your search query or switching categories.
            </p>
          </div>
        ) : (
          <div className="product-grid">
            <style>{`
              .product-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 24px;
                padding-bottom: 50px;
                align-items: start;
              }
              
              .product-card {
                position: relative;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                height: auto;
                cursor: pointer;
                border: 1px solid rgba(0, 0, 0, 0.07);
                background: #ffffff;
                box-shadow: 0 4px 18px rgba(0, 0, 0, 0.02);
              }
              
              .product-card:hover {
                transform: translateY(-4px);
                border-color: rgba(255, 90, 0, 0.2);
                box-shadow: 0 12px 25px rgba(0, 0, 0, 0.04), 0 2px 10px rgba(0, 0, 0, 0.01);
              }
              
              .category-scroll::-webkit-scrollbar {
                height: 4px;
              }
              
              .qty-btn {
                background: rgba(0, 0, 0, 0.04);
                border: 1px solid rgba(0, 0, 0, 0.06);
                border-radius: 6px;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: var(--text-primary);
                font-weight: 800;
              }
              
              .qty-btn:hover {
                background: var(--accent-orange);
                color: white;
                border-color: var(--accent-orange);
              }

              .qty-btn:active {
                transform: scale(0.95);
              }
            `}</style>
            
            {filteredProducts.map((product, idx) => {
              const productId = product._id || `product-${idx}`;
              const inStock = product.stock > 0;
              const lowStock = product.stock > 0 && product.stock <= 5;
              const qty = getQuantity(productId);

              // Use primary dynamic image, fallback property, or tech icon placeholder
              const productImg = product.image || product.imageUrl;
              
              return (
                <div 
                  key={productId} 
                  className="glass-container product-card fade-in"
                  style={{ 
                    padding: "20px",
                    animationDelay: `${idx * 0.04}s`,
                    borderRadius: "12px"
                  }}
                >
                  {/* Category Badge overlay on top of product image */}
                  <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 5 }}>
                    <span 
                      style={{ 
                        fontSize: "0.7rem", 
                        fontWeight: 700,
                        color: "var(--text-secondary)", 
                        background: "#ffffff",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                        display: "flex", 
                        alignItems: "center", 
                        gap: "4px"
                      }}
                    >
                      {getCategoryIcon(product.category)}
                      {product.category}
                    </span>
                  </div>

                  {/* Product Image Frame */}
                  <div 
                    style={{ 
                      width: "100%", 
                      height: "160px", 
                      borderRadius: "8px", 
                      background: "#f8f9fa",
                      overflow: "hidden",
                      marginBottom: "10px",
                      position: "relative",
                      border: "1px solid rgba(0,0,0,0.04)"
                    }}
                  >
                    {productImg ? (
                      <img 
                        src={productImg} 
                        alt={product.name} 
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "cover",
                          objectPosition: "center"
                        }}
                      />
                    ) : (
                      // Gorgeous technology icon fallback placeholder
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyItems: "center", background: "rgba(255, 90, 0, 0.03)" }}>
                        <div style={{ margin: "auto", color: "var(--accent-orange)", opacity: 0.7 }}>
                          {product.category.toLowerCase() === "mobile" ? (
                            <Smartphone size={40} />
                          ) : product.category.toLowerCase() === "laptop" ? (
                            <Laptop size={40} />
                          ) : (
                            <Box size={40} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Title & Stock Level in Parens */}
                  <div 
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "flex-start", 
                      gap: "10px", 
                      marginBottom: "6px", 
                      zIndex: 1 
                    }}
                  >
                    <h3 
                      style={{ 
                        fontSize: "1.05rem", 
                        fontWeight: 700, 
                        color: "var(--text-primary)",
                        margin: 0,
                        flex: 1
                      }}
                    >
                      {product.name}
                    </h3>
                    <span 
                      style={{ 
                        fontSize: "1.05rem", 
                        fontWeight: 800, 
                        color: inStock ? "#097969" : "#dc2626",
                        whiteSpace: "nowrap"
                      }}
                    >
                      ({product.stock})
                    </span>
                  </div>

                  {/* Pricing, Brand, and Corner Quantity Selector Footer */}
                  <div 
                    style={{ 
                      marginTop: "6px", 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "flex-end",
                      borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                      paddingTop: "8px",
                      zIndex: 1
                    }}
                  >
                    {/* Brand and Price in the exact same font and size */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                      <span 
                        style={{ 
                          fontFamily: "var(--font-display)", 
                          fontSize: "1.05rem", 
                          fontWeight: 700, 
                          color: "var(--accent-orange)",
                          textTransform: "uppercase",
                          letterSpacing: "-0.02em"
                        }}
                      >
                        {product.brand}
                      </span>
                      <span 
                        style={{ 
                          fontFamily: "var(--font-display)", 
                          fontSize: "1.05rem", 
                          fontWeight: 800, 
                          color: "var(--text-primary)"
                        }}
                      >
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    {/* Quantity Selector corner pill (Plus and Minus controllers) */}
                    <div 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px", 
                        background: "rgba(0, 0, 0, 0.02)", 
                        border: "1px solid rgba(0, 0, 0, 0.06)", 
                        borderRadius: "8px", 
                        padding: "3px" 
                      }}
                    >
                      <button 
                        className="qty-btn"
                        onClick={() => handleDecrement(productId)}
                        disabled={qty <= 0}
                        style={{ opacity: qty <= 0 ? 0.35 : 1, pointerEvents: qty <= 0 ? "none" : "auto" }}
                        title="Decrease quantity"
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      
                      <span 
                        style={{ 
                          fontSize: "0.85rem", 
                          fontWeight: 800, 
                          minWidth: "18px", 
                          textAlign: "center",
                          color: qty > 0 ? "var(--accent-orange)" : "var(--text-secondary)"
                        }}
                      >
                        {qty}
                      </span>
                      
                      <button 
                        className="qty-btn"
                        onClick={() => handleIncrement(productId, product.stock)}
                        disabled={!inStock || qty >= product.stock}
                        style={{ opacity: (!inStock || qty >= product.stock) ? 0.35 : 1, pointerEvents: (!inStock || qty >= product.stock) ? "none" : "auto" }}
                        title="Increase quantity"
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutModal && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(17, 17, 17, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.2s ease-out"
          }}
        >
          <div 
            className="glass-container fade-in"
            style={{
              width: "90%",
              maxWidth: "400px",
              padding: "35px 30px",
              background: "#ffffff",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
              position: "relative",
              overflow: "hidden",
              borderRadius: "14px"
            }}
          >
            {/* Top brand accent border */}
            <div 
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "var(--accent-orange)"
              }}
            />

            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <div 
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "var(--accent-orange-glow)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-orange)",
                  marginBottom: "15px"
                }}
              >
                <LogOut size={20} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                Confirm Log Out
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Are you sure you want to log out of StoreHub? Your active session will end.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="glass-btn"
                style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem", boxShadow: "none" }}
              >
                Yes, Log Out
              </button>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="glass-btn-secondary"
                style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem", boxShadow: "none", background: "#f4f4f6", color: "var(--text-primary)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                No, Keep Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
