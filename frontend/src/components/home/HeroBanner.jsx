import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

const tokens = {
    primary: '#FF5A1F',
    primaryDark: '#E04A10',
    primaryLight: '#FFF1EC',
    secondary: '#3D5AF1',
    secondaryLight: '#EEF1FF',
    bg: '#F4F5F7',
    surface: '#FFFFFF',
    surfaceAlt: '#F8F9FB',
    text: '#1A1A2E',
    textMuted: '#6B7280',
    textFaint: '#9CA3AF',
    border: '#E5E7EB',
    radius: '14px',
    radiusSm: '10px',
    radiusLg: '20px',
    shadow: '0 2px 12px rgba(0,0,0,0.07)',
    shadowMd: '0 4px 24px rgba(0,0,0,0.10)',
    shadowLg: '0 8px 40px rgba(0,0,0,0.13)',
};

const POPULAR_TAGS = ['Cars', 'Bikes', 'Laptops', 'Cameras', 'Furniture'];

const FALLBACK_BANNERS = [
    { _id: '1', banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80', title: 'Rent Vehicles' },
    { _id: '2', banner: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80', title: 'Rent Cameras' },
    { _id: '3', banner: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=1200&q=80', title: 'Rent Electronics' },
];

// ─── Ad Banner Slider ────────────────────────────────────────────────────────

const AdBanner = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [hoverPrev, setHoverPrev] = useState(false);
    const [hoverNext, setHoverNext] = useState(false);
    const [arrowsVisible, setArrowsVisible] = useState(false);
    const intervalRef = useRef(null);

    const fetchBanners = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getPublicBanners('', 5);
            if (response.success && response.data.banners?.length > 0) {
                setBanners(response.data.banners);
            } else {
                setBanners(FALLBACK_BANNERS);
            }
        } catch {
            setBanners(FALLBACK_BANNERS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBanners(); }, [fetchBanners]);

    useEffect(() => {
        if (banners.length > 1 && !isPaused) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % banners.length);
            }, 5000);
        }
        return () => clearInterval(intervalRef.current);
    }, [banners.length, isPaused]);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));

    if (loading) {
        return (
            <div
                style={{
                    width: '100%',
                    height: 180,
                    background: '#F3F4F6',
                    borderRadius: tokens.radiusLg,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                }}
            >
                <Zap size={28} color={tokens.primary} />
                <span style={{ fontSize: 11, fontWeight: 700, color: tokens.textFaint, letterSpacing: '0.15em' }}>
                    PREPARING DEALS
                </span>
            </div>
        );
    }

    return (
        <div
            onMouseEnter={() => { setIsPaused(true); setArrowsVisible(true); }}
            onMouseLeave={() => { setIsPaused(false); setArrowsVisible(false); }}
            style={{
                position: 'relative',
                width: '100%',
                height: 180,
                borderRadius: tokens.radiusLg,
                overflow: 'hidden',
                background: '#111',
            }}
        >
            {/* Slides */}
            {banners.map((banner, index) => (
                <div
                    key={banner._id}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        transition: 'opacity 0.9s ease, transform 0.9s ease',
                        opacity: index === currentIndex ? 1 : 0,
                        transform: index === currentIndex ? 'scale(1)' : 'scale(1.04)',
                        pointerEvents: index === currentIndex ? 'auto' : 'none',
                    }}
                >
                    <img
                        src={banner.banner}
                        alt={banner.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* subtle dark gradient on left for legibility if text is added later */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 60%)',
                    }} />
                </div>
            ))}

            {/* Prev arrow */}
            <button
                onClick={prevSlide}
                onMouseEnter={() => setHoverPrev(true)}
                onMouseLeave={() => setHoverPrev(false)}
                style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    zIndex: 10,
                    width: 36, height: 36, borderRadius: '50%',
                    background: hoverPrev ? tokens.surface : 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: hoverPrev ? tokens.text : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: arrowsVisible ? 1 : 0,
                    transition: 'opacity 0.2s, background 0.2s, color 0.2s',
                }}
            >
                <ChevronLeft size={20} />
            </button>

            {/* Next arrow */}
            <button
                onClick={nextSlide}
                onMouseEnter={() => setHoverNext(true)}
                onMouseLeave={() => setHoverNext(false)}
                style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    zIndex: 10,
                    width: 36, height: 36, borderRadius: '50%',
                    background: hoverNext ? tokens.surface : 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: hoverNext ? tokens.text : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: arrowsVisible ? 1 : 0,
                    transition: 'opacity 0.2s, background 0.2s, color 0.2s',
                }}
            >
                <ChevronRight size={20} />
            </button>

            {/* Progress dots */}
            <div
                style={{
                    position: 'absolute', bottom: 12, right: 14,
                    zIndex: 10, display: 'flex', alignItems: 'center', gap: 6,
                }}
            >
                {banners.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        style={{
                            width: currentIndex === i ? 28 : 7,
                            height: 5,
                            borderRadius: 100,
                            background: currentIndex === i ? tokens.primary : 'rgba(255,255,255,0.45)',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            transition: 'width 0.4s ease, background 0.3s ease',
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

// ─── Hero Section ────────────────────────────────────────────────────────────

const HeroSection = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [inputFocused, setInputFocused] = useState(false);

    const handleSearch = () => {
        if (query.trim()) navigate(`/listings?search=${encodeURIComponent(query.trim())}`);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div
            style={{
                background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 60%, #16213e 100%)',
                borderRadius: tokens.radiusLg,
                padding: '24px 8px 16px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative blobs */}
            <div style={{
                position: 'absolute', top: -40, right: -40,
                width: 160, height: 160, borderRadius: '50%',
                background: 'rgba(61,90,241,0.18)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: -30, left: -30,
                width: 120, height: 120, borderRadius: '50%',
                background: 'rgba(255,90,31,0.12)', pointerEvents: 'none',
            }} />

            {/* Badge */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,90,31,0.18)',
                border: '1px solid rgba(255,90,31,0.3)',
                borderRadius: 100, padding: '5px 14px',
                marginBottom: 20,
            }}>
                <Zap size={13} color={tokens.primary} />
                <span style={{ fontSize: 12, fontWeight: 700, color: tokens.primary, letterSpacing: '0.04em' }}>
                    India's #1 Rental Marketplace
                </span>
            </div>

            {/* Headline */}
            <h1 style={{ margin: '0 0 8px', lineHeight: 1.15 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', display: 'block' }}>
                    Rent Anything,
                </span>
                <span style={{ fontSize: 36, fontWeight: 900, color: tokens.primary, display: 'block' }}>
                    Anytime
                </span>
            </h1>

            <p style={{
                fontSize: 14, color: 'rgba(255,255,255,0.6)',
                margin: '0 auto 28px', maxWidth: 380, lineHeight: 1.6,
            }}>
                Discover thousands of items from trusted people in your community. Save money, reduce waste, live better.
            </p>

            {/* Search bar */}
            {/* <div style={{
                display: 'flex', alignItems: 'center',
                background: '#fff',
                borderRadius: 12,
                border: `2px solid ${inputFocused ? tokens.primary : 'transparent'}`,
                overflow: 'hidden',
                maxWidth: 480, margin: '0 auto 20px',
                transition: 'border-color 0.2s',
                boxShadow: tokens.shadowMd,
            }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Search for cars, laptops, furniture…"
                    style={{
                        flex: 1, border: 'none', outline: 'none',
                        padding: '12px 8px', fontSize: 12,
                        color: tokens.text, background: 'transparent',
                    }}
                />
                <button
                    onClick={handleSearch}
                    style={{
                        background: tokens.primary, color: '#fff',
                        border: 'none', padding: '16px 16px',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        transition: 'background 0.15s',
                        whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = tokens.primaryDark}
                    onMouseLeave={e => e.currentTarget.style.background = tokens.primary}
                >
                    Search
                </button>
            </div> */}

            {/* Popular tags */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={12} color={tokens.primary} /> Popular:
                </span>
                {POPULAR_TAGS.map((tag) => (
                    <button
                        key={tag}
                        onClick={() => navigate(`/listings?search=${tag}`)}
                        style={{
                            padding: '6px 12px', borderRadius: 100,
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.75)',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            transition: 'border-color 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = tokens.primary; e.currentTarget.style.color = tokens.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {/* Stats */}
            {/* <div style={{
                display: 'flex', justifyContent: 'center', gap: 40, marginTop: 32,
            }}>
                {[['50K+', 'Active Rentals'], ['100K+', 'Verified Users'], ['12+', 'Categories']].map(([val, label]) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{val}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{label}</div>
                    </div>
                ))}
            </div> */}
        </div>
    );
};

// ─── Combined HeroBanner ─────────────────────────────────────────────────────

const HeroBanner = () => {
    return (
        <div style={{ padding: '16px 16px 0', background: '#fff' }}>
            <div style={{ maxWidth: 'auto', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <HeroSection />
                {/* <AdBanner /> */}
            </div>
        </div>
    );
};

export default HeroBanner;