const fs = require('fs');

let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. Add interface fields
const interfaceTarget = `redeemPromoCode: (code: string) => { success: boolean; message: string; pointsEarned?: number };`;
const interfaceReplacement = `redeemPromoCode: (code: string) => Promise<{ success: boolean; message: string; pointsEarned?: number }> | { success: boolean; message: string; pointsEarned?: number };
  promoCodesList: any[];
  fetchPromoCodes: () => Promise<void>;
  addOrUpdatePromoCode: (promoData: { code: string; points: number; description?: string; max_uses?: number; is_active?: number }) => Promise<boolean>;
  deletePromoCode: (code: string) => Promise<boolean>;`;

if (code.includes(interfaceTarget)) {
  code = code.replace(interfaceTarget, interfaceReplacement);
  console.log('Updated AppContext interface');
} else {
  console.error('Could not find AppContext interface target');
}

// 2. Replace redeemPromoCode implementation and add promo code functions
const fnTarget = `  // Redeem Promo Code
  const redeemPromoCode = (code: string) => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Giriş yapmalısınız.' };
    }
    const cleanCode = code.trim().toUpperCase();
    const promo = PROMO_CODES[cleanCode];
    if (!promo) {
      return { success: false, message: 'Geçersiz promosyon kodu.' };
    }
    const userInventory = user.inventory || [];
    const promoKey = \`promo_\${cleanCode}\`;
    if (userInventory.includes(promoKey)) {
      return { success: false, message: 'Bu promosyon kodunu daha önce kullandınız.' };
    }
    const isUnlimited = user.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com';
    const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 250);
    const updatedUser: User = {
      ...user,
      coins: isUnlimited ? 999999999 : currentCoins + promo.points,
      inventory: [...userInventory, promoKey]
    };
    setUser(updatedUser);
    return {
      success: true,
      message: \`🎁 Harika! "\${cleanCode}" kodundan +\${promo.points} Cosmo-Puan hesabınıza yüklendi! (\${promo.description})\`,
      pointsEarned: promo.points
    };
  };`;

const fnReplacement = `  // Promo Codes State
  const [promoCodesList, setPromoCodesList] = useState<any[]>([]);

  const fetchPromoCodes = async () => {
    try {
      const res = await fetch('/api/promo-codes');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.promoCodes)) {
        setPromoCodesList(data.promoCodes);
      }
    } catch (e) {
      console.error('Failed to fetch promo codes:', e);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const addOrUpdatePromoCode = async (promoData: { code: string; points: number; description?: string; max_uses?: number; is_active?: number }) => {
    try {
      const res = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoData)
      });
      const data = await res.json();
      if (data && data.success) {
        await fetchPromoCodes();
        showToast({
          title: 'Promosyon Kodu Kaydedildi 🎁',
          message: data.message || \`"\${promoData.code.toUpperCase()}" kodu Cloudflare D1 veritabanına kaydedildi!\`,
          type: 'success'
        });
        return true;
      } else {
        showToast({
          title: 'Hata ⚠️',
          message: data.message || 'Kod kaydedilemedi.',
          type: 'warning'
        });
      }
    } catch (e) {
      console.error('Error saving promo code:', e);
    }
    return false;
  };

  const deletePromoCode = async (code: string) => {
    try {
      const res = await fetch(\`/api/promo-codes?code=\${encodeURIComponent(code)}\`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data && data.success) {
        await fetchPromoCodes();
        showToast({
          title: 'Promosyon Kodu Silindi 🗑️',
          message: \`"\${code}" promosyon kodu Cloudflare veritabanından silindi.\`,
          type: 'info'
        });
        return true;
      }
    } catch (e) {
      console.error('Error deleting promo code:', e);
    }
    return false;
  };

  // Redeem Promo Code
  const redeemPromoCode = async (code: string) => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Kupon kodu kullanmak için lütfen önce giriş yapın.' };
    }
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Lütfen geçerli bir promosyon kodu girin.' };
    }

    try {
      const res = await fetch('/api/promo-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          email: user.email,
          userId: user.id
        })
      });
      const data = await res.json();

      if (data && data.success) {
        const pointsEarned = Number(data.pointsEarned) || 100;
        const promoKey = \`promo_\${cleanCode}\`;
        const userInventory = user.inventory || [];
        const updatedInventory = userInventory.includes(promoKey) ? userInventory : [...userInventory, promoKey];
        const isUnlimited = user.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com' || user.email?.toLowerCase() === 'aseleliyeva77@gmail.com';
        const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 250);
        const updatedCoins = isUnlimited ? 999999999 : (data.newCoins ?? (currentCoins + pointsEarned));

        const updatedUser: User = {
          ...user,
          coins: updatedCoins,
          inventory: updatedInventory
        };
        setUser(updatedUser);

        return {
          success: true,
          message: data.message || \`🎁 Harika! "\${cleanCode}" kodundan +\${pointsEarned} Cosmo-Puan hesabınıza yüklendi!\`,
          pointsEarned
        };
      } else {
        return {
          success: false,
          message: data.message || 'Geçersiz veya süresi dolmuş promosyon kodu.'
        };
      }
    } catch (e) {
      console.error('API promo redeem error, fallback to local lookup:', e);
      const promo = PROMO_CODES[cleanCode];
      if (!promo) {
        return { success: false, message: 'Geçersiz promosyon kodu.' };
      }
      const userInventory = user.inventory || [];
      const promoKey = \`promo_\${cleanCode}\`;
      if (userInventory.includes(promoKey)) {
        return { success: false, message: 'Bu promosyon kodunu daha önce kullandınız.' };
      }
      const isUnlimited = user.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com' || user.email?.toLowerCase() === 'aseleliyeva77@gmail.com';
      const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 250);
      const updatedUser: User = {
        ...user,
        coins: isUnlimited ? 999999999 : currentCoins + promo.points,
        inventory: [...userInventory, promoKey]
      };
      setUser(updatedUser);
      return {
        success: true,
        message: \`🎁 Harika! "\${cleanCode}" kodundan +\${promo.points} Cosmo-Puan hesabınıza yüklendi!\`,
        pointsEarned: promo.points
      };
    }
  };`;

if (code.includes(fnTarget)) {
  code = code.replace(fnTarget, fnReplacement);
  console.log('Replaced redeemPromoCode in AppContext');
} else {
  console.error('Could not find fnTarget in AppContext');
}

// 3. Add to provider value
const providerTarget = `        redeemPromoCode,`;
const providerReplacement = `        redeemPromoCode,
        promoCodesList,
        fetchPromoCodes,
        addOrUpdatePromoCode,
        deletePromoCode,`;

if (code.includes(providerTarget)) {
  code = code.replace(providerTarget, providerReplacement);
  console.log('Updated AppContext Provider value');
} else {
  console.error('Could not find providerTarget in AppContext');
}

fs.writeFileSync('src/context/AppContext.tsx', code, 'utf8');
