// dbCode  : 이 아이템/그룹에 해당하는 product_groups.code 값
// groupDbCode : 그룹 전체를 선택할 때 사용하는 product_groups.code 값
// categoryDbCode : 최상위 카테고리 code 값

export const categories = [
  {
    label: "맨즈웨어",
    value: "menswear",
    categoryDbCode: "MENS",
    groups: [
      {
        title: "상의",
        value: "top",
        groupDbCode: "MENS_TOP",
        items: [
          { label: "티셔츠",  value: "t-shirt",    dbCode: "MENS_TOP_TSHIRT" },
          { label: "후드티",  value: "hoodie",     dbCode: "MENS_TOP_HOODIE" },
          { label: "니트",    value: "knit",       dbCode: "MENS_TOP_KNIT" },
          { label: "맨투맨",  value: "sweatshirt", dbCode: "MENS_TOP_SWEATSHIRT" },
          { label: "셔츠",    value: "shirt",      dbCode: "MENS_TOP_SHIRT" },
          { label: "가디건",  value: "cardigan",   dbCode: "MENS_TOP_CARDIGAN" },
        ],
      },
      {
        title: "아우터",
        value: "outer",
        groupDbCode: "MENS_OUTER",
        items: [
          { label: "저지",       value: "jersey",      dbCode: "MENS_OUTER_JERSEY" },
          { label: "바람막이",   value: "windbreaker", dbCode: "MENS_OUTER_WINDBREAKER" },
          { label: "자켓",       value: "jacket",      dbCode: "MENS_OUTER_JACKET" },
          { label: "후드집업",   value: "hood-zipup",  dbCode: "MENS_OUTER_HOODIE_ZIP" },
          { label: "봄버/블루종", value: "bomber",     dbCode: "MENS_OUTER_BLOUSON" },
          { label: "코트",       value: "coat",        dbCode: "MENS_OUTER_COAT" },
          { label: "패딩",       value: "padding",     dbCode: "MENS_OUTER_PADDING" },
        ],
      },
      {
        title: "하의",
        value: "bottom",
        groupDbCode: "MENS_BOTTOM",
        items: [
          { label: "반바지",    value: "shorts",      dbCode: "MENS_BOTTOM_SHORTS" },
          { label: "데님팬츠",  value: "denim-pants", dbCode: "MENS_BOTTOM_DENIM" },
          { label: "카고팬츠",  value: "cargo-pants", dbCode: "MENS_BOTTOM_CARGO" },
          { label: "스웨트팬츠", value: "sweat-pants", dbCode: "MENS_BOTTOM_SWEAT" },
          { label: "슬랙스",    value: "slacks",      dbCode: "MENS_BOTTOM_SLACKS" },
        ],
      },
      {
        title: "신발",
        value: "shoes",
        groupDbCode: "MENS_SHOES",
        items: [
          { label: "스니커즈",    value: "sneakers", dbCode: "MENS_SHOES_SNEAKERS" },
          { label: "부츠",        value: "boots",    dbCode: "MENS_SHOES_BOOTS" },
          { label: "구두/로퍼",   value: "loafer",   dbCode: "MENS_SHOES_LOAFER" },
          { label: "샌들/슬리퍼", value: "sandals",  dbCode: "MENS_SHOES_SANDAL" },
        ],
      },
      {
        title: "가방",
        value: "bag",
        groupDbCode: "MENS_BAG",
        items: [
          { label: "백팩",    value: "backpack",     dbCode: "MENS_BAG_BACKPACK" },
          { label: "크로스백", value: "cross-bag",   dbCode: "MENS_BAG_CROSSBODY" },
          { label: "숄더백",  value: "shoulder-bag", dbCode: "MENS_BAG_SHOULDER" },
          { label: "토트백",  value: "tote-bag",     dbCode: "MENS_BAG_TOTE" },
        ],
      },
      {
        title: "모자",
        value: "hat",
        groupDbCode: "MENS_CAP",
        items: [
          { label: "캡",  value: "cap",    dbCode: "MENS_CAP_CAP" },
          { label: "비니", value: "beanie", dbCode: "MENS_CAP_BEANIE" },
        ],
      },
    ],
  },
  {
    label: "우먼즈웨어",
    value: "womenswear",
    categoryDbCode: "WOMENS",
    groups: [
      {
        title: "상의",
        value: "top",
        groupDbCode: "WOMENS_TOP",
        items: [
          { label: "티셔츠",  value: "t-shirt",    dbCode: "WOMENS_TOP_TSHIRT" },
          { label: "후드티",  value: "hoodie",     dbCode: "WOMENS_TOP_HOODIE" },
          { label: "니트",    value: "knit",       dbCode: "WOMENS_TOP_KNIT" },
          { label: "맨투맨",  value: "sweatshirt", dbCode: "WOMENS_TOP_SWEATSHIRT" },
          { label: "셔츠",    value: "shirt",      dbCode: "WOMENS_TOP_SHIRT" },
          { label: "가디건",  value: "cardigan",   dbCode: "WOMENS_TOP_CARDIGAN" },
        ],
      },
      {
        title: "아우터",
        value: "outer",
        groupDbCode: "WOMENS_OUTER",
        items: [
          { label: "저지",     value: "jersey",      dbCode: "WOMENS_OUTER_JERSEY" },
          { label: "바람막이", value: "windbreaker", dbCode: "WOMENS_OUTER_WINDBREAKER" },
          { label: "자켓",     value: "jacket",      dbCode: "WOMENS_OUTER_JACKET" },
          { label: "후드집업", value: "hood-zipup",  dbCode: "WOMENS_OUTER_HOODIE_ZIP" },
          { label: "코트",     value: "coat",        dbCode: "WOMENS_OUTER_COAT" },
          { label: "패딩",     value: "padding",     dbCode: "WOMENS_OUTER_PADDING" },
        ],
      },
      {
        title: "하의",
        value: "bottom",
        groupDbCode: "WOMENS_BOTTOM",
        items: [
          { label: "반바지",    value: "shorts",      dbCode: "WOMENS_BOTTOM_SHORTS" },
          { label: "데님팬츠",  value: "denim-pants", dbCode: "WOMENS_BOTTOM_DENIM" },
          { label: "카고팬츠",  value: "cargo-pants", dbCode: "WOMENS_BOTTOM_CARGO" },
          { label: "스웨트팬츠", value: "sweat-pants", dbCode: "WOMENS_BOTTOM_SWEAT" },
          { label: "슬랙스",    value: "slacks",      dbCode: "WOMENS_BOTTOM_SLACKS" },
        ],
      },
      {
        title: "신발",
        value: "shoes",
        groupDbCode: "WOMENS_SHOES",
        items: [
          { label: "스니커즈",    value: "sneakers", dbCode: "WOMENS_SHOES_SNEAKERS" },
          { label: "부츠",        value: "boots",    dbCode: "WOMENS_SHOES_BOOTS" },
          { label: "구두/로퍼",   value: "loafer",   dbCode: "WOMENS_SHOES_LOAFER" },
          { label: "샌들/슬리퍼", value: "sandals",  dbCode: "WOMENS_SHOES_SANDAL" },
        ],
      },
      {
        title: "가방",
        value: "bag",
        groupDbCode: "WOMENS_BAG",
        items: [
          { label: "백팩",    value: "backpack",     dbCode: "WOMENS_BAG_BACKPACK" },
          { label: "크로스백", value: "cross-bag",   dbCode: "WOMENS_BAG_CROSSBODY" },
          { label: "숄더백",  value: "shoulder-bag", dbCode: "WOMENS_BAG_SHOULDER" },
          { label: "토트백",  value: "tote-bag",     dbCode: "WOMENS_BAG_TOTE" },
        ],
      },
      {
        title: "모자",
        value: "hat",
        groupDbCode: "WOMENS_CAP",
        items: [
          { label: "캡",  value: "cap",    dbCode: "WOMENS_CAP_CAP" },
          { label: "비니", value: "beanie", dbCode: "WOMENS_CAP_BEANIE" },
        ],
      },
      {
        title: "치마",
        value: "skirt",
        groupDbCode: "WOMENS_SKIRT",
        items: [
          { label: "롱 스커트",  value: "long-skirt",  dbCode: "WOMENS_SKIRT_LONG" },
          { label: "미니 스커트", value: "mini-skirt",  dbCode: "WOMENS_SKIRT_MINI" },
        ],
      },
      {
        title: "원피스",
        value: "onepiece",
        groupDbCode: "WOMENS_DRESS",
        items: [
          { label: "롱 원피스",  value: "long-onepiece", dbCode: "WOMENS_DRESS_LONG" },
          { label: "미니 원피스", value: "mini-onepiece", dbCode: "WOMENS_DRESS_MINI" },
        ],
      },
    ],
  },
  {
    label: "럭셔리",
    value: "luxury",
    categoryDbCode: "LUXURY",
    groups: [
      {
        title: "브랜드",
        value: "brand",
        groupDbCode: "LUXURY_BRAND",
        items: [
          { label: "고야드",      value: "goyard",         dbCode: "LUXURY_GOYARD" },
          { label: "보테가베네타", value: "bottega-veneta", dbCode: "LUXURY_BOTTEGA" },
          { label: "크리스찬디올", value: "dior",           dbCode: "LUXURY_DIOR" },
          { label: "루이비통",    value: "louis-vuitton",  dbCode: "LUXURY_LV" },
          { label: "구찌",        value: "gucci",          dbCode: "LUXURY_GUCCI" },
          { label: "프라다",      value: "prada",          dbCode: "LUXURY_PRADA" },
          { label: "페라가모",    value: "ferragamo",      dbCode: "LUXURY_FERRAGAMO" },
          { label: "몽블랑",      value: "montblanc",      dbCode: "LUXURY_MONTBLANC" },
          { label: "에르메스",    value: "hermes",         dbCode: "LUXURY_HERMES" },
          { label: "버버리",      value: "burberry",       dbCode: "LUXURY_BURBERRY" },
          { label: "샤넬",        value: "chanel",         dbCode: "LUXURY_CHANEL" },
          { label: "크롬하츠",    value: "chrome-hearts",  dbCode: "LUXURY_CHROME_HEARTS" },
        ],
      },
    ],
  },
  {
    label: "액세서리",
    value: "accessory",
    categoryDbCode: "ACC",
    groups: [
      {
        title: "패션잡화",
        value: "fashion-goods",
        groupDbCode: "ACC_FASHION",
        items: [
          { label: "선글라스", value: "sunglasses", dbCode: "ACC_SUNGLASS" },
          { label: "지갑",     value: "wallet",     dbCode: "ACC_WALLET" },
          { label: "벨트",     value: "belt",       dbCode: "ACC_BELT" },
          { label: "키링",     value: "keyring",    dbCode: "ACC_KEYRING" },
        ],
      },
      {
        title: "주얼리",
        value: "jewelry",
        groupDbCode: "ACC_JEWELRY",
        items: [
          { label: "목걸이", value: "necklace",  dbCode: "ACC_JEWELRY_NECKLACE" },
          { label: "반지",   value: "ring",      dbCode: "ACC_JEWELRY_RING" },
          { label: "시계",   value: "watch",     dbCode: "ACC_JEWELRY_WATCH" },
          { label: "팔찌",   value: "bracelet",  dbCode: "ACC_JEWELRY_BRACELET" },
        ],
      },
    ],
  },
  {
    label: "IT/테크",
    value: "tech",
    categoryDbCode: "IT",
    groups: [
      {
        title: "디바이스",
        value: "device",
        groupDbCode: "IT_DEVICE",
        items: [
          { label: "카메라",  value: "camera",  dbCode: "IT_CAMERA" },
          { label: "핸드폰",  value: "mobile",  dbCode: "IT_PHONE" },
          { label: "노트북",  value: "laptop",  dbCode: "IT_LAPTOP" },
          { label: "태블릿",  value: "tablet",  dbCode: "IT_TABLET" },
        ],
      },
    ],
  },
];

export function getCategoryItems(category) {
  return category?.groups.flatMap((group) => group.items) || [];
}

export function findCategory(categoryValue) {
  return categories.find((category) => category.value === categoryValue);
}

export function findSubcategory(category, subcategoryValue) {
  const group = category?.groups.find((categoryGroup) => categoryGroup.value === subcategoryValue);
  if (group) {
    return { label: group.title, value: group.value };
  }

  return getCategoryItems(category).find((subcategory) => subcategory.value === subcategoryValue);
}

/**
 * product_groups.code → 카테고리 페이지 URL 변환
 * "MENS_TOP_TSHIRT" → "/category/menswear?subcategory=t-shirt"
 * "MENS_TOP"        → "/category/menswear?subcategory=top"
 * "MENS"            → "/category/menswear"
 */
export function categoryCodeToUrl(dbCode) {
  if (!dbCode) return "/";
  for (const cat of categories) {
    if (cat.categoryDbCode === dbCode) {
      return `/category/${cat.value}`;
    }
    for (const grp of cat.groups) {
      if (grp.groupDbCode === dbCode) {
        return `/category/${cat.value}?subcategory=${grp.value}`;
      }
      for (const item of grp.items) {
        if (item.dbCode === dbCode) {
          return `/category/${cat.value}?subcategory=${item.value}`;
        }
      }
    }
  }
  return "/";
}

export function resolveDbCode(category, subcategoryValue) {
  if (!category) return null;

  if (!subcategoryValue) return category.categoryDbCode;

  // subcategoryValue 가 그룹인지 확인
  const group = category.groups.find((g) => g.value === subcategoryValue);
  if (group) return group.groupDbCode;

  // subcategoryValue 가 아이템인지 확인
  for (const grp of category.groups) {
    const item = grp.items.find((i) => i.value === subcategoryValue);
    if (item) return item.dbCode;
  }

  return category.categoryDbCode;
}
