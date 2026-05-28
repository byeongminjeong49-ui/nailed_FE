import { useState, useEffect, useRef } from "react";
import { registerProduct, uploadImage, getBrands, getProductDetail, updateProduct, deleteProduct, changeProductStatus } from "../api/productApi";
import { toBrandNameEn } from "../utils/brandName";
import "../styles/sell.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ── CategoryCode enum 기준 카테고리 트리 ─────────────────────────────
const CATEGORY_TREE = [
  {
    code: "MENS", label: "맨즈웨어",
    groups: [
      { code: "MENS_TOP", label: "상의", items: [
        { code: "MENS_TOP_TSHIRT",      label: "티셔츠" },
        { code: "MENS_TOP_HOODIE",      label: "후드티" },
        { code: "MENS_TOP_KNIT",        label: "니트" },
        { code: "MENS_TOP_SWEATSHIRT",  label: "맨투맨" },
        { code: "MENS_TOP_SHIRT",       label: "셔츠" },
        { code: "MENS_TOP_CARDIGAN",    label: "가디건" },
      ]},
      { code: "MENS_OUTER", label: "아우터", items: [
        { code: "MENS_OUTER_JERSEY",      label: "저지" },
        { code: "MENS_OUTER_WINDBREAKER", label: "바람막이" },
        { code: "MENS_OUTER_JACKET",      label: "자켓" },
        { code: "MENS_OUTER_HOODIE_ZIP",  label: "후드집업" },
        { code: "MENS_OUTER_BLOUSON",     label: "볼버/블루종" },
        { code: "MENS_OUTER_COAT",        label: "코트" },
        { code: "MENS_OUTER_PADDING",     label: "패딩" },
      ]},
      { code: "MENS_BOTTOM", label: "하의", items: [
        { code: "MENS_BOTTOM_SHORTS", label: "반바지" },
        { code: "MENS_BOTTOM_DENIM",  label: "데님팬츠" },
        { code: "MENS_BOTTOM_CARGO",  label: "카고팬츠" },
        { code: "MENS_BOTTOM_SWEAT",  label: "스웨트팬츠" },
        { code: "MENS_BOTTOM_SLACKS", label: "슬랙스" },
      ]},
      { code: "MENS_SHOES", label: "신발", items: [
        { code: "MENS_SHOES_SNEAKERS", label: "스니커즈" },
        { code: "MENS_SHOES_BOOTS",    label: "부츠" },
        { code: "MENS_SHOES_LOAFER",   label: "구두/로퍼" },
        { code: "MENS_SHOES_SANDAL",   label: "샌들/슬리퍼" },
      ]},
      { code: "MENS_BAG", label: "가방", items: [
        { code: "MENS_BAG_BACKPACK",  label: "백팩" },
        { code: "MENS_BAG_CROSSBODY", label: "크로스백" },
        { code: "MENS_BAG_SHOULDER",  label: "숄더백" },
        { code: "MENS_BAG_TOTE",      label: "토트백" },
      ]},
      { code: "MENS_CAP", label: "모자", items: [
        { code: "MENS_CAP_CAP",    label: "캡" },
        { code: "MENS_CAP_BEANIE", label: "비니" },
      ]},
    ],
  },
  {
    code: "WOMENS", label: "우먼즈웨어",
    groups: [
      { code: "WOMENS_TOP", label: "상의", items: [
        { code: "WOMENS_TOP_TSHIRT",     label: "티셔츠" },
        { code: "WOMENS_TOP_HOODIE",     label: "후드티" },
        { code: "WOMENS_TOP_KNIT",       label: "니트" },
        { code: "WOMENS_TOP_SWEATSHIRT", label: "맨투맨" },
        { code: "WOMENS_TOP_SHIRT",      label: "셔츠" },
        { code: "WOMENS_TOP_CARDIGAN",   label: "가디건" },
      ]},
      { code: "WOMENS_OUTER", label: "아우터", items: [
        { code: "WOMENS_OUTER_JERSEY",      label: "저지" },
        { code: "WOMENS_OUTER_WINDBREAKER", label: "바람막이" },
        { code: "WOMENS_OUTER_JACKET",      label: "자켓" },
        { code: "WOMENS_OUTER_HOODIE_ZIP",  label: "후드집업" },
        { code: "WOMENS_OUTER_COAT",        label: "코트" },
        { code: "WOMENS_OUTER_PADDING",     label: "패딩" },
      ]},
      { code: "WOMENS_BOTTOM", label: "하의", items: [
        { code: "WOMENS_BOTTOM_SHORTS", label: "반바지" },
        { code: "WOMENS_BOTTOM_DENIM",  label: "데님팬츠" },
        { code: "WOMENS_BOTTOM_CARGO",  label: "카고팬츠" },
        { code: "WOMENS_BOTTOM_SWEAT",  label: "스웨트팬츠" },
        { code: "WOMENS_BOTTOM_SLACKS", label: "슬랙스" },
      ]},
      { code: "WOMENS_SHOES", label: "신발", items: [
        { code: "WOMENS_SHOES_SNEAKERS", label: "스니커즈" },
        { code: "WOMENS_SHOES_BOOTS",    label: "부츠" },
        { code: "WOMENS_SHOES_LOAFER",   label: "구두/로퍼" },
        { code: "WOMENS_SHOES_SANDAL",   label: "샌들/슬리퍼" },
      ]},
      { code: "WOMENS_BAG", label: "가방", items: [
        { code: "WOMENS_BAG_BACKPACK",  label: "백팩" },
        { code: "WOMENS_BAG_CROSSBODY", label: "크로스백" },
        { code: "WOMENS_BAG_SHOULDER",  label: "숄더백" },
        { code: "WOMENS_BAG_TOTE",      label: "토트백" },
      ]},
      { code: "WOMENS_CAP", label: "모자", items: [
        { code: "WOMENS_CAP_CAP",    label: "캡" },
        { code: "WOMENS_CAP_BEANIE", label: "비니" },
      ]},
      { code: "WOMENS_SKIRT", label: "치마", items: [
        { code: "WOMENS_SKIRT_LONG", label: "롱 스커트" },
        { code: "WOMENS_SKIRT_MINI", label: "미니 스커트" },
      ]},
      { code: "WOMENS_DRESS", label: "원피스", items: [
        { code: "WOMENS_DRESS_LONG", label: "롱 원피스" },
        { code: "WOMENS_DRESS_MINI", label: "미니 원피스" },
      ]},
    ],
  },
  {
    code: "LUXURY", label: "럭셔리",
    groups: [
      { code: "LUXURY_BRAND", label: "브랜드", items: [
        { code: "LUXURY_GOYARD",        label: "고야드" },
        { code: "LUXURY_GUCCI",         label: "구찌" },
        { code: "LUXURY_HERMES",        label: "에르메스" },
        { code: "LUXURY_BOTTEGA",       label: "보테가베네타" },
        { code: "LUXURY_PRADA",         label: "프라다" },
        { code: "LUXURY_BURBERRY",      label: "버버리" },
        { code: "LUXURY_DIOR",          label: "크리스찬디올" },
        { code: "LUXURY_FERRAGAMO",     label: "페라가모" },
        { code: "LUXURY_CHANEL",        label: "샤넬" },
        { code: "LUXURY_LV",            label: "루이비통" },
        { code: "LUXURY_MONTBLANC",     label: "몽블랑" },
        { code: "LUXURY_CHROME_HEARTS", label: "크롬하츠" },
      ]},
    ],
  },
  {
    code: "ACC", label: "액세서리",
    groups: [
      { code: "ACC_FASHION", label: "패션잡화", items: [
        { code: "ACC_SUNGLASS", label: "선글라스" },
        { code: "ACC_WALLET",   label: "지갑" },
        { code: "ACC_BELT",     label: "벨트" },
        { code: "ACC_KEYRING",  label: "키링" },
      ]},
      { code: "ACC_JEWELRY", label: "주얼리", items: [
        { code: "ACC_JEWELRY_NECKLACE",  label: "목걸이" },
        { code: "ACC_JEWELRY_RING",      label: "반지" },
        { code: "ACC_JEWELRY_WATCH",     label: "시계" },
        { code: "ACC_JEWELRY_BRACELET",  label: "팔찌" },
      ]},
    ],
  },
  {
    code: "IT", label: "IT/테크",
    groups: [
      { code: "IT_DEVICE", label: "디바이스", items: [
        { code: "IT_CAMERA", label: "카메라" },
        { code: "IT_PHONE",  label: "핸드폰" },
        { code: "IT_LAPTOP", label: "노트북" },
        { code: "IT_TABLET", label: "태블릿" },
      ]},
    ],
  },
];

// ── ProductCondition enum 기준 상태 ───────────────────────────────────
const CONDITIONS = [
  { code: "S", label: "새제품" },
  { code: "A", label: "거의 새것" },
  { code: "B", label: "상태 좋음" },
  { code: "C", label: "상태 보통" },
  { code: "D", label: "사용감 많음" },
];

// ── SizeCode enum 기준 사이즈 ─────────────────────────────────────────
const CLOTHING_SIZES = [
  "OS","XXS","XS","S","M","L","XL","2XL","3XL",
  "24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","기타",
];
const SHOE_SIZES = [
  "210","215","220","225","230","235","240","245","250",
  "255","260","265","270","275","280","285","290","295","300",
];

function getSizeType(itemCode) {
  if (!itemCode) return null;
  if (itemCode.startsWith("LUXURY_")) return "all";
  if (itemCode.includes("_SHOES_")) return "shoes";
  if (/_(?:TOP|OUTER|BOTTOM|SKIRT|DRESS)_/.test(itemCode)) return "clothing";
  return null;
}

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function findCategoryByPath(path) {
  const parts = (path || "").split(" > ").map((s) => s.trim());
  for (const top of CATEGORY_TREE) {
    if (top.label !== parts[0]) continue;
    for (const group of top.groups) {
      if (group.label !== parts[1]) continue;
      for (const item of group.items) {
        if (item.label === parts[2]) return { topCode: top.code, groupCode: group.code, itemCode: item.code };
      }
      return { topCode: top.code, groupCode: group.code, itemCode: "" };
    }
    return { topCode: top.code, groupCode: "", itemCode: "" };
  }
  return { topCode: "MENS", groupCode: "", itemCode: "" };
}

export default function SellPage({ editProductId }) {
  const [images, setImages]               = useState([]);
  const [title, setTitle]                 = useState("");
  const [description, setDescription]     = useState("");
  const [topCode, setTopCode]             = useState("MENS");
  const [groupCode, setGroupCode]         = useState("");
  const [itemCode, setItemCode]           = useState("");
  const [selectedSize, setSelectedSize]   = useState("");
  const [condition, setCondition]         = useState("");
  const [brandId, setBrandId]             = useState("");
  const [price, setPrice]                 = useState("");
  const [shippingFee, setShippingFee]     = useState("");
  const [hashtags, setHashtags]           = useState("");
  const [productStatus, setProductStatus] = useState("ON_SALE");
  const [brands, setBrands]               = useState([]);
  const [codeToGroupId, setCodeToGroupId] = useState({});
  const [submitting, setSubmitting]       = useState(false);
  const [errors, setErrors]               = useState({});
  const isEditMode                        = Boolean(editProductId);

  const fileInputRef = useRef();
  const dragItem     = useRef(null);
  const dragOver     = useRef(null);

  useEffect(() => {
    const catPromise = fetch(`${API_BASE}/api/products/categories`)
      .then((r) => r.json())
      .then((res) => {
        const cats = Array.isArray(res.data) ? res.data : [];
        const map = {};
        cats.forEach((c) => { map[c.code] = c.groupId; });
        setCodeToGroupId(map);
        return cats;
      })
      .catch(() => []);

    const brandPromise = getBrands().then((list) => { setBrands(list); return list; }).catch(() => []);

    if (isEditMode) {
      Promise.all([catPromise, brandPromise, getProductDetail(editProductId)])
        .then(([, brandList, product]) => {
          setTitle(product.title);
          setDescription(product.description);
          setPrice(String(product.price));
          setCondition(product.conditionCode);
          setSelectedSize(product.size || "");
          setHashtags(product.hashtags || "");
          setProductStatus(product.productStatus || "ON_SALE");

          const { topCode: tc, groupCode: gc, itemCode: ic } = findCategoryByPath(product.categoryPath);
          setTopCode(tc);
          setGroupCode(gc);
          setItemCode(ic);

          if (product.brandName) {
            const matched = brandList.find((b) => b.name === product.brandName);
            if (matched) setBrandId(String(matched.groupId));
          }

          if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
            setImages(product.imageUrls.map((url) => ({
              id: crypto.randomUUID(),
              preview: url,
              url,
              uploading: false,
            })));
          }
        })
        .catch(() => {});
    }
  }, [editProductId]);

  const topCategory  = CATEGORY_TREE.find((c) => c.code === topCode);
  const groups       = topCategory?.groups ?? [];
  const selectedGroup = groups.find((g) => g.code === groupCode);
  const items        = selectedGroup?.items ?? [];
  const sizeType     = getSizeType(itemCode);
  const sizeOptions  =
    sizeType === "all"      ? [...CLOTHING_SIZES, ...SHOE_SIZES] :
    sizeType === "shoes"    ? SHOE_SIZES :
    sizeType === "clothing" ? CLOTHING_SIZES : [];

  const handleTopChange = (code) => {
    setTopCode(code);
    setGroupCode("");
    setItemCode("");
    setSelectedSize("");
    setBrandId("");
    // 그룹이 하나뿐인 카테고리는 자동 선택
    const cat = CATEGORY_TREE.find((c) => c.code === code);
    if (cat?.groups.length === 1) setGroupCode(cat.groups[0].code);
  };

  const handleGroupChange = (code) => {
    setGroupCode(code);
    setItemCode("");
    setSelectedSize("");
  };

  const handleImageSelect = async (files) => {
    const remaining = 10 - images.length;
    const filesToAdd = Array.from(files).slice(0, remaining);
    if (!filesToAdd.length) return;

    // 같은 파일 재선택 시에도 onChange 발동되도록 인풋 리셋
    if (fileInputRef.current) fileInputRef.current.value = "";

    const newImages = filesToAdd.map((f) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(f),
      url: null,
      uploading: true,
      file: f,
    }));
    setImages((prev) => [...prev, ...newImages]);

    for (const img of newImages) {
      try {
        const url = await uploadImage(img.file);
        setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, url, uploading: false } : i)));
      } catch {
        setImages((prev) => prev.filter((i) => i.id !== img.id));
      }
    }
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const list = [...images];
    const [moved] = list.splice(dragItem.current, 1);
    list.splice(dragOver.current, 0, moved);
    setImages(list);
    dragItem.current = dragOver.current = null;
  };

  const handleSubmit = async () => {
    const errs = {};
    if (images.length === 0)                  errs.images      = "이미지를 최소 1장 등록해주세요.";
    else if (images.some((i) => i.uploading)) errs.images      = "이미지 업로드 중입니다. 잠시 기다려주세요.";
    if (!title.trim())                        errs.title       = "제목을 입력해주세요.";
    if (!description.trim())                  errs.description = "설명을 입력해주세요.";
    if (!itemCode)                            errs.category    = "서브 카테고리를 선택해주세요.";
    if (!condition)                           errs.condition   = "상태를 선택해주세요.";
    if (!price || Number(price) < 1000)       errs.price       = "최소 1,000원 이상 입력해주세요.";

    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    const body = {
      title:         title.trim(),
      categoryId:    codeToGroupId[itemCode],
      brandId:       (brandId && brandId !== "NOBRAND") ? Number(brandId) : null,
      price:         Number(price),
      description:   description.trim(),
      conditionCode: condition,
      size:          selectedSize || null,
      hashtags:      hashtags.trim() || null,
      imageUrls:     images.map((i) => i.url),
    };

    try {
      if (isEditMode) {
        await updateProduct(editProductId, body);
        await changeProductStatus(editProductId, productStatus);
      } else {
        await registerProduct(body);
      }
      navigate("/mypage");
    } catch (e) {
      setErrors({ submit: e.message || (isEditMode ? "수정에 실패했습니다." : "등록에 실패했습니다.") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("상품을 삭제하시겠습니까? 삭제된 상품은 복구할 수 없습니다.")) return;
    try {
      await deleteProduct(editProductId);
      navigate("/mypage");
    } catch (e) {
      setErrors({ submit: e.message || "삭제에 실패했습니다." });
    }
  };

  return (
    <div className="sell-page">

      {/* ── 상단 헤더 ── */}
      <div className="sell-header">
        <span className="sell-header-title">
          {isEditMode ? "상품 수정" : <>상품 등록 <span className="sell-beta">Beta</span></>}
        </span>
        <div className="sell-header-actions">
          <button className="sell-cancel-btn" onClick={() => window.history.back()}>취소</button>
          {isEditMode && (
            <button className="sell-delete-btn" onClick={handleDelete}>상품 삭제</button>
          )}
          <button className="sell-upload-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (isEditMode ? "수정 중..." : "등록 중...") : (isEditMode ? "수정 완료" : "업로드")}
          </button>
        </div>
      </div>

      <div className="sell-body">

        {/* ── 왼쪽: 사진 ── */}
        <div className="sell-left">
          <div className="sell-section-label">사진</div>
          <div
            className="sell-image-area"
            onClick={() => images.length === 0 && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleImageSelect(e.dataTransfer.files); }}
          >
            {images.length === 0 ? (
              <div className="sell-image-placeholder">
                <button type="button" className="sell-image-btn"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  사진 선택
                </button>
                <p className="sell-image-hint">
                  최대 10장까지 업로드 가능하고 드래그하여 순서를 바꿀 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="sell-image-grid">
                {images.map((img, idx) => (
                  <div key={img.id} className="sell-image-thumb"
                    draggable
                    onDragStart={() => { dragItem.current = idx; }}
                    onDragEnter={() => { dragOver.current = idx; }}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <img src={img.preview} alt="" />
                    {img.uploading && <div className="sell-image-loading">업로드 중</div>}
                    {idx === 0 && <span className="sell-image-badge">대표</span>}
                    <button className="sell-image-remove"
                      onClick={(e) => { e.stopPropagation(); setImages((p) => p.filter((i) => i.id !== img.id)); }}>
                      ×
                    </button>
                  </div>
                ))}
                {images.length < 10 && (
                  <div className="sell-image-add"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    <span>+</span>
                    <span className="sell-image-add-count">{images.length}/10</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.images && <p className="sell-error">{errors.images}</p>}
          <input ref={fileInputRef} type="file" accept="image/*" multiple
            style={{ display: "none" }} onChange={(e) => handleImageSelect(e.target.files)} />
          <p className="sell-tip">
            Tip: 다양한 상세 사진을 업로드하고 <span className="sell-tip-link">판매속도를 올려보세요</span>
          </p>
        </div>

        {/* ── 오른쪽: 폼 ── */}
        <div className="sell-right">

          {/* 제목 */}
          <div className="sell-field">
            <div className="sell-field-label">제목</div>
            <div className="sell-input-wrap">
              <input className={`sell-input${errors.title ? " error" : ""}`}
                placeholder="상품 제목 입력" value={title} maxLength={40}
                onChange={(e) => setTitle(e.target.value)} />
              <span className="sell-count">{title.length}/40</span>
            </div>
            {errors.title && <p className="sell-error">{errors.title}</p>}
          </div>

          {/* 설명 */}
          <div className="sell-field">
            <div className="sell-field-label">설명</div>
            <div className="sell-input-wrap">
              <textarea className={`sell-textarea${errors.description ? " error" : ""}`}
                placeholder={"상품 설명은 자세히 적을수록 빠르게 판매할 수 있어요.\n구매 시기, 사용 기간, 하자 여부, 소재, 선물 사이즈 등"}
                value={description} maxLength={2500}
                onChange={(e) => setDescription(e.target.value)} />
              <span className="sell-count">{description.length}/2500</span>
            </div>
            {errors.description && <p className="sell-error">{errors.description}</p>}
          </div>

          {/* 최상위 카테고리 */}
          <div className="sell-field">
            <div className="sell-field-label">카테고리</div>
            <div className="sell-chips">
              {CATEGORY_TREE.map((cat) => (
                <button key={cat.code} type="button"
                  className={`sell-chip${topCode === cat.code ? " active" : ""}`}
                  onClick={() => handleTopChange(cat.code)}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 서브 카테고리 (그룹) — 그룹이 2개 이상일 때만 표시 */}
          {groups.length > 1 && (
            <div className="sell-field">
              <div className="sell-field-label">서브 카테고리</div>
              <div className="sell-chips">
                {groups.map((g) => (
                  <button key={g.code} type="button"
                    className={`sell-chip${groupCode === g.code ? " active" : ""}`}
                    onClick={() => handleGroupChange(g.code)}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 상세 카테고리 (아이템) */}
          {items.length > 0 && (
            <div className="sell-field">
              <div className="sell-field-label">상세 카테고리</div>
              <div className="sell-chips">
                {items.map((item) => (
                  <button key={item.code} type="button"
                    className={`sell-chip${itemCode === item.code ? " active" : ""}`}
                    onClick={() => {
                      setItemCode(item.code);
                      setSelectedSize("");
                      // 럭셔리 상세카테고리 선택 시 동일 code의 브랜드 항목 자동 연결
                      if (item.code.startsWith("LUXURY_")) {
                        const matched = brands.find((b) => b.code === item.code);
                        setBrandId(matched ? String(matched.groupId) : "");
                      }
                    }}>
                    {item.label}
                  </button>
                ))}
              </div>
              {errors.category && <p className="sell-error">{errors.category}</p>}
            </div>
          )}

          {/* 사이즈 — SizeCode 기준 (의류 / 신발) */}
          {sizeOptions.length > 0 && (
            <div className="sell-field">
              <div className="sell-field-label">사이즈</div>
              <div className="sell-chips">
                {sizeOptions.map((s) => (
                  <button key={s} type="button"
                    className={`sell-chip${selectedSize === s ? " active" : ""}`}
                    onClick={() => setSelectedSize(selectedSize === s ? "" : s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 상태 — ProductCondition enum 기준 */}
          <div className="sell-field">
            <div className="sell-field-label">상태</div>
            <div className="sell-chips">
              {CONDITIONS.map((c) => (
                <button key={c.code} type="button"
                  className={`sell-chip${condition === c.code ? " active" : ""}`}
                  onClick={() => setCondition(c.code)}>
                  {c.label}
                </button>
              ))}
            </div>
            {errors.condition && <p className="sell-error">{errors.condition}</p>}
          </div>

          {/* 브랜드 */}
          <div className="sell-field">
            <div className="sell-field-label">브랜드</div>
            {topCode === "LUXURY" ? (
              // 럭셔리: 상세카테고리 선택 시 자동 표시 (직접 선택 불가)
              <div className="sell-input sell-brand-readonly">
                {brandId
                  ? toBrandNameEn(brands.find((b) => String(b.groupId) === String(brandId))?.name) ?? "브랜드 선택 안 됨"
                  : "상세 카테고리를 선택하면 자동 입력됩니다"}
              </div>
            ) : (
              // 일반: LUXURY_* 항목 제외한 브랜드 드롭다운
              <select className="sell-select" value={brandId}
                onChange={(e) => setBrandId(e.target.value)}>
                <option value="" disabled hidden>브랜드를 선택해주세요</option>
                {brands
                  .filter((b) => !b.code?.startsWith("LUXURY_"))
                  .map((b) => (
                    <option key={b.groupId} value={b.groupId}>{toBrandNameEn(b.name)}</option>
                  ))
                }
                <option value="NOBRAND">브랜드 없음</option>
              </select>
            )}
          </div>

          {/* 판매가 + 기본 배송비 2열 */}
          <div className="sell-field sell-field-row">
            <div className="sell-field-col">
              <div className="sell-field-label">판매가</div>
              <div className="sell-price-wrap">
                <input type="text" className={`sell-input${errors.price ? " error" : ""}`}
                  placeholder="0" value={price}
                  onChange={(e) => setPrice(e.target.value)} />
                <span className="sell-unit">원</span>
              </div>
              {errors.price && <p className="sell-error">{errors.price}</p>}
            </div>
            <div className="sell-field-col">
              <div className="sell-field-label">기본 배송비</div>
              <div className="sell-price-wrap">
                <input type="text" className="sell-input"
                  placeholder="0" value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)} />
                <span className="sell-unit">원</span>
              </div>
            </div>
          </div>

          {/* 판매 상태 — 수정 모드에서만 표시 */}
          {isEditMode && (
            <div className="sell-field">
              <div className="sell-field-label">판매 상태</div>
              <div className="sell-status-group">
                <button type="button"
                  className={`sell-status-btn${productStatus === "ON_SALE" ? " active" : ""}`}
                  onClick={() => setProductStatus("ON_SALE")}>
                  판매중
                </button>
                <button type="button"
                  className={`sell-status-btn${productStatus === "SOLD" ? " active" : ""}`}
                  onClick={() => setProductStatus("SOLD")}>
                  판매완료
                </button>
              </div>
            </div>
          )}

          {/* 해시태그 */}
          <div className="sell-field">
            <div className="sell-field-label">해시태그</div>
            <input className="sell-input" placeholder="# 없이 쉼표로 구분해 입력"
              value={hashtags} maxLength={500}
              onChange={(e) => setHashtags(e.target.value)} />
          </div>

          {errors.submit && <p className="sell-error sell-error-submit">{errors.submit}</p>}
        </div>
      </div>
    </div>
  );
}
