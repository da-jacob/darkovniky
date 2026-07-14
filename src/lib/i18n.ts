export const locale = "cs-CZ";
export const currency = "CZK";

export function formatPrice(price?: string | null): string | null {
  if (!price) return null;
  const num = Number(price);
  if (Number.isNaN(num)) return null;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatItemCount(count: number): string {
  if (count === 1) return "1 položka";
  if (count >= 2 && count <= 4) return `${count} položky`;
  return `${count} položek`;
}

export function formatShowingCount(shown: number, total: number): string {
  const word = total === 1 ? "položky" : total >= 2 && total <= 4 ? "položky" : "položek";
  return `Zobrazeno ${shown} z ${total} ${word}`;
}

export const t = {
  appName: "Dárkovníky",
  meta: {
    title: "Dárkovníky — Sdílejte seznamy přání a nápady na dárky",
    description:
      "Vytvořte veřejný seznam dárků, které chcete, a soukromé seznamy nápadů pro ostatní.",
  },
  nav: {
    dashboard: "Přehled",
    myWishlist: "Můj seznam přání",
    logIn: "Přihlásit se",
    logOut: "Odhlásit se",
    signUp: "Registrace",
  },
  home: {
    tagline: "Seznamy přání jednoduše",
    headline: "Sdílejte, co chcete. Nápady na dárky si nechte pro sebe.",
    description:
      "Vytvořte veřejný seznam přání pro přátele a rodinu a soukromé seznamy pro plánování překvapení.",
    goToDashboard: "Přejít na přehled",
    getStarted: "Začít zdarma",
    publicWishlists: "Veřejné seznamy přání",
    publicWishlistsHint: "Prohlížejte, co si ostatní přejí",
    noWishlists: "Zatím žádné veřejné seznamy. Buďte první a",
    signUpLink: "zaregistrujte se",
  },
  auth: {
    welcomeBack: "Vítejte zpět",
    loginHint: "Přihlaste se pro správu svých seznamů",
    login: "Přihlásit se",
    noAccount: "Nemáte účet?",
    createAccount: "Vytvořte si účet",
    registerHint: "Začněte sdílet seznam přání během chvilky",
    register: "Vytvořit účet",
    hasAccount: "Už máte účet?",
    username: "Uživatelské jméno",
    password: "Heslo",
    confirmPassword: "Potvrzení hesla",
    pleaseWait: "Počkejte prosím…",
    usernamePlaceholder: "vasejmeno",
  },
  dashboard: {
    title: "Přehled",
    greeting: (username: string) =>
      `Ahoj @${username} — spravujte svůj veřejný seznam přání a soukromé nápady na dárky.`,
    publicWishlist: "Váš veřejný seznam přání",
    defaultWishlistTitle: "Můj seznam přání",
    publicHint: "Viditelný pro všechny na veřejném odkazu",
    viewPublicPage: "Zobrazit veřejnou stránku",
    addGift: "Přidat dárek, který chcete",
    emptyWishlist: "Váš seznam přání je prázdný. Přidejte první položku výše!",
    privateIdeas: "Soukromé nápady na dárky",
    privateHint: "Vidíte je pouze vy — ideální pro plánování překvapení.",
    createList: "Vytvořit nový seznam",
    yourPrivateLists: "Vaše soukromé seznamy",
    noPrivateLists: "Zatím žádné soukromé seznamy.",
    forRecipient: (name: string, count: number, linkedUsername?: string) =>
      linkedUsername
        ? `Pro @${linkedUsername} · ${formatItemCount(count)}`
        : `Pro ${name} · ${formatItemCount(count)}`,
  },
  privateList: {
    back: "← Zpět na přehled",
    label: "Soukromý seznam",
    giftIdeasFor: (name: string) => `Nápady na dárky pro ${name}`,
    giftIdeasForUser: (username: string) => `Nápady na dárky pro @${username}`,
    viewWishlist: "Zobrazit seznam přání",
    addIdea: "Přidat nápad na dárek",
    empty: "Zatím žádné nápady. Přidejte první výše.",
    deleteConfirm: "Smazat tento soukromý seznam a všechny jeho položky?",
    deleteList: "Smazat seznam",
  },
  publicWishlist: {
    label: "Veřejný seznam přání",
    by: "od",
    empty: "Tento seznam přání je zatím prázdný. Zkuste to později!",
  },
  notFound: {
    title: "Stránka nenalezena",
    description: "Tento seznam přání nebo stránka neexistuje.",
    goHome: "Domů",
  },
  items: {
    name: "Název položky",
    namePlaceholder: "Bezdrátová sluchátka",
    url: "Odkaz (volitelné)",
    price: "Cena (volitelné)",
    pricePlaceholder: "1299",
    adding: "Přidávání…",
    add: "Přidat položku",
    minPrice: "Min. cena",
    maxPrice: "Max. cena",
    anyPrice: "Libovolná",
    clear: "Vymazat",
    noPrice: "Cena neuvedena",
    viewLink: "Zobrazit odkaz",
    remove: "Odstranit",
    removeAria: (name: string) => `Odstranit ${name}`,
  },
  privateListForm: {
    title: "Název seznamu",
    titlePlaceholder: "Nápady na narozeniny pro mámu",
    recipient: "Dárek je pro",
    recipientPlaceholder: "Máma",
    modeRegistered: "Registrovaný uživatel",
    modeGuest: "Bez účtu",
    searchUsers: "Vyhledat uživatele",
    searchPlaceholder: "Zadejte uživatelské jméno…",
    searching: "Hledám…",
    noUsersFound: "Žádní uživatelé nenalezeni",
    selectedUser: "Vybráno",
    clearSelection: "Zrušit výběr",
    creating: "Vytváření…",
    create: "Vytvořit soukromý seznam",
  },
  wishlistTitle: (username: string) => `Seznam přání uživatele ${username}`,
  errors: {
    usernameMin: "Uživatelské jméno musí mít alespoň 3 znaky",
    usernameChars: "Uživatelské jméno může obsahovat pouze písmena, číslice a podtržítka",
    passwordMin: "Heslo musí mít alespoň 6 znaků",
    passwordsMismatch: "Hesla se neshodují",
    usernameTaken: "Uživatelské jméno je již obsazeno",
    credentialsRequired: "Uživatelské jméno a heslo jsou povinné",
    invalidCredentials: "Neplatné uživatelské jméno nebo heslo",
    titleRequired: "Název je povinný",
    recipientRequired: "Jméno obdarovaného je povinné",
    recipientOrUserRequired: "Vyberte uživatele nebo zadejte jméno obdarovaného",
    userNotFound: "Uživatel nenalezen",
    cannotLinkSelf: "Nemůžete vytvořit seznam pro sebe",
    listNotFound: "Seznam nenalezen",
    cannotDeleteList: "Tento seznam nelze smazat",
    itemNameRequired: "Název položky je povinný",
    itemNotFound: "Položka nenalezena",
    wishlistNotFound: "Seznam přání nenalezen",
  },
} as const;
