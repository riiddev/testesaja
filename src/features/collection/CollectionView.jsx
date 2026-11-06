import {
  IconCheck,
  IconLock
} from "../../components/common/Icons.jsx";
import React, { useState } from "react";
import { CATALOG_ITEMS, getXpProgressForLevel } from "./collectionCatalog.js";
import { AvatarWithBorder } from "../profile/AvatarWithBorder.jsx";
import { KanciMascot } from "../../components/mascot/KanciMascot.jsx";
import { getAssetUrl } from "../../data/assets.js";
import "../../styles/collection.css";

export function CollectionView({ userProfileHook }) {
  const {
    profile,
    avatarUrl,
    calculatedLevel,
    inventory = [],
    equippedBorder = "border_daun",
    equippedOutfit = null,
    buyItem,
    equipItem
  } = userProfileHook;

  const [activeTab, setActiveTab] = useState("all"); // "all" | "border" | "outfit" | "utility"
  const [previewBorder, setPreviewBorder] = useState(equippedBorder);
  const [previewOutfit, setPreviewOutfit] = useState(equippedOutfit);
  
  // Modals state
  const [confirmItem, setConfirmItem] = useState(null);
  const [unlockedCelebrationItem, setUnlockedCelebrationItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentCoins = profile.coins || 0;
  const currentXp = profile.xp || 0;
  const xpProgress = getXpProgressForLevel(currentXp);

  // Filter items
  const displayedItems = CATALOG_ITEMS.filter((item) => {
    if (activeTab === "all") return true;
    return item.type === activeTab;
  });

  // Check item state helper
  const getItemStatus = (item) => {
    const isLocked = calculatedLevel < item.levelReq;
    const isOwned = inventory.some((it) => it.itemId === item.id);
    const isEquipped = item.type === "border" 
      ? equippedBorder === item.id 
      : item.type === "outfit" 
      ? equippedOutfit === item.id.replace(/^outfit_/, "") 
      : false;

    return { isLocked, isOwned, isEquipped };
  };

  // Preview click
  const handleItemClick = (item) => {
    if (item.type === "border") {
      setPreviewBorder(item.id);
    } else if (item.type === "outfit") {
      setPreviewOutfit(item.id.replace(/^outfit_/, ""));
    }
  };

  // Purchase initiation
  const handleStartBuy = (item, e) => {
    e.stopPropagation();
    setErrorMessage("");
    setConfirmItem(item);
  };

  // Confirm Purchase execution
  const handleConfirmPurchase = async () => {
    if (!confirmItem) return;
    setIsProcessing(true);
    setErrorMessage("");

    const res = await buyItem(confirmItem.id);
    setIsProcessing(false);

    if (res.success) {
      const bought = confirmItem;
      setConfirmItem(null);
      setUnlockedCelebrationItem(bought);
      // Auto-preview purchased item
      if (bought.type === "border") setPreviewBorder(bought.id);
      if (bought.type === "outfit") setPreviewOutfit(bought.id.replace(/^outfit_/, ""));
    } else {
      setErrorMessage(res.error || "Gagal melakukan pembelian item.");
    }
  };

  // Equip handler
  const handleEquip = async (item, e) => {
    e.stopPropagation();
    if (item.type === "border") {
      await equipItem(item.id, "border");
      setPreviewBorder(item.id);
    } else if (item.type === "outfit") {
      await equipItem(item.id, "outfit");
      setPreviewOutfit(item.id.replace(/^outfit_/, ""));
    }
  };

  // Unequip handler
  const handleUnequip = async (item, e) => {
    e.stopPropagation();
    if (item.type === "border") {
      await equipItem("none", "border");
      setPreviewBorder("none");
    } else if (item.type === "outfit") {
      await equipItem("none", "outfit");
      setPreviewOutfit(null);
    }
  };

  return (
    <div className="collection-container" id="collection-view-root">
      {/* 1. ECONOMY STATUS BANNER */}
      <section className="collection-header-card" aria-label="Status Ekonomi Pelajar">
        <div>
          <span style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800, color: "var(--color-text-secondary)" }}>
            Ekonomi & Katalog Pembelajar
          </span>
          <h2 style={{ fontSize: "var(--text-2xl)", margin: "4px 0 6px" }}>
            Koleksi & Ruang Kanci
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: 0, maxWidth: "480px" }}>
            Tukarkan Sinau Coin dari misi dan kuis untuk membuka bingkai avatar sarjana serta perlengkapan Kanci sang pemandu belajar.
          </p>
        </div>

        <div className="economy-stats-row">
          {/* Coin Pill */}
          <div className="coin-balance-pill" id="collection-coin-pill">
            <img
              src={getAssetUrl("ui", "coin") || "/assets/ui/sinau-coin.png"}
              alt="Sinau Coin"
              style={{ width: "24px", height: "24px", objectFit: "contain" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <span id="collection-coins-amount">{currentCoins}</span>
            <span style={{ fontSize: "var(--text-xs)", color: "#744210" }}>Coin</span>
          </div>

          {/* Level & XP Progress Track */}
          <div className="level-progress-box">
            <div className="level-progress-header">
              <span id="collection-current-level">Level {calculatedLevel}</span>
              <span id="collection-xp-progress-text">{currentXp} / {xpProgress.nextLvlBaseXp} EXP</span>
            </div>
            <div className="level-track">
              <div
                className="level-fill"
                id="collection-level-fill"
                style={{ width: `${xpProgress.percentage}%` }}
              />
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px", display: "block" }}>
              {xpProgress.xpToNextLevel} EXP lagi menuju Level {xpProgress.nextLevel}
            </span>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE STUDIO PREVIEW STAGE */}
      <section className="preview-stage-card" aria-label="Studio Pratinjau Langsung">
        {/* Left: Scholar Avatar Preview */}
        <div className="preview-avatar-box">
          <span className="preview-label">Pratinjau Avatar Profil</span>
          <AvatarWithBorder
            avatarUrl={avatarUrl}
            initialLetter={profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "S"}
            equippedBorder={previewBorder}
            size={96}
            id="preview-scholar-avatar"
          />
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700 }}>
              {previewBorder ? previewBorder.replace("border_", "Border ") : "Tanpa Border"}
            </span>
            {previewBorder !== equippedBorder && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPreviewBorder(equippedBorder)}
                style={{ fontSize: "11px", padding: "2px 8px", minHeight: "28px" }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right: Kanci Mascot Preview */}
        <div className="preview-kanci-box">
          <span className="preview-label">Pratinjau Maskot Kanci</span>
          <KanciMascot
            expression="happy"
            equippedOutfit={previewOutfit}
            size="md"
            dialogue="Semangat belajarmu hari ini sungguh mengagumkan!"
          />
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700 }}>
              {previewOutfit ? `Outfit: ${previewOutfit}` : "Kanci Natural"}
            </span>
            {previewOutfit !== equippedOutfit && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPreviewOutfit(equippedOutfit)}
                style={{ fontSize: "11px", padding: "2px 8px", minHeight: "28px" }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. CATALOG TABS */}
      <div className="collection-tabs" role="tablist" aria-label="Kategori Koleksi">
        {[
          { id: "all", label: "Semua Item" },
          { id: "border", label: "Border Avatar (6)" },
          { id: "outfit", label: "Outfit Kanci (4)" },
          { id: "utility", label: "Utilitas Belajar (1)" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`collection-tab-btn ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            id={`tab-btn-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. CATALOG GRID */}
      <div className="collection-grid" id="collection-items-grid">
        {displayedItems.map((item) => {
          const { isLocked, isOwned, isEquipped } = getItemStatus(item);

          return (
            <div
              key={item.id}
              className={`catalog-card ${isLocked ? "is-locked" : ""} ${isEquipped ? "is-equipped" : ""}`}
              onClick={() => handleItemClick(item)}
              style={{ cursor: "pointer" }}
              id={`card-item-${item.id}`}
            >
              <div className="catalog-card-header">
                <span className="catalog-badge-level">
                  Level {item.levelReq}
                </span>

                {isEquipped ? (
                  <span className="catalog-badge-equipped">
                    <><IconCheck size={12} style={{ marginRight: 3 }} /> Digunakan</>
                  </span>
                ) : isOwned ? (
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-success)" }}>
                    <><IconCheck size={12} style={{ marginRight: 3 }} /> Dimiliki</>
                  </span>
                ) : (
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "#744210" }}>
                    {item.price > 0 ? `${item.price} Coin` : "Gratis"}
                  </span>
                )}
              </div>

              {/* Visual Icon */}
              <div className="catalog-card-icon-wrap">
                {item.type === "border" ? (
                  <AvatarWithBorder
                    initialLetter="S"
                    equippedBorder={item.id}
                    size={64}
                  />
                ) : item.type === "outfit" ? (
                  <KanciMascot
                    expression="base"
                    equippedOutfit={item.id.replace(/^outfit_/, "")}
                    size="sm"
                    animate={false}
                  />
                ) : (
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "#EBF8FF",
                      border: "2px solid #3182CE",
                      display: "grid",
                      placeItems: "center"
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2B6CB0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Text Info */}
              <div className="catalog-card-body">
                <h3 className="catalog-item-title">{item.name}</h3>
                <p className="catalog-item-desc">{item.description}</p>
              </div>

              {/* Card Actions */}
              <div className="catalog-card-footer">
                {isLocked ? (
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled
                    style={{ width: "100%", opacity: 0.6, minHeight: "40px" }}
                  >
                    <><IconLock size={12} style={{ marginRight: 3 }} /> Terkunci (Butuh Lvl {item.levelReq})</>
                  </button>
                ) : isEquipped ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={(e) => handleUnequip(item, e)}
                    style={{ width: "100%", minHeight: "40px" }}
                    id={`btn-unequip-${item.id}`}
                  >
                    Lepas
                  </button>
                ) : isOwned ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={(e) => handleEquip(item, e)}
                    style={{ width: "100%", minHeight: "40px" }}
                    id={`btn-equip-${item.id}`}
                  >
                    Gunakan Sekarang
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => handleStartBuy(item, e)}
                    disabled={currentCoins < item.price}
                    style={{ width: "100%", minHeight: "40px" }}
                    id={`btn-buy-${item.id}`}
                  >
                    {item.price === 0 ? "Buka Gratis" : `Beli • ${item.price} Coin`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. PURCHASE CONFIRMATION MODAL */}
      {confirmItem && (
        <div
          className="modal-overlay is-open"
          id="buy-confirm-modal-overlay"
          onClick={() => !isProcessing && setConfirmItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            padding: "var(--space-4)",
            zIndex: 1000
          }}
        >
          <div
            className="card card-tint-sand"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "440px",
              padding: "var(--space-6)",
              borderRadius: "var(--radius-xl)",
              border: "var(--border-md)",
              boxShadow: "var(--shadow-lg)"
            }}
          >
            <h3 style={{ fontSize: "var(--text-xl)", margin: "0 0 var(--space-2)" }}>
              Konfirmasi Penukaran Koin
            </h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
              Apakah Anda ingin membuka item <strong>{confirmItem.name}</strong> ke inventaris belajar Anda?
            </p>

            <div
              className="card card-tint-cream"
              style={{ padding: "var(--space-4)", marginBottom: "var(--space-4)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "var(--text-sm)" }}>
                <span>Harga Item:</span>
                <strong style={{ color: "#744210" }}>{confirmItem.price} Coin</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "var(--text-sm)" }}>
                <span>Saldo Coin Saat Ini:</span>
                <span>{currentCoins} Coin</span>
              </div>
              <hr style={{ border: 0, borderTop: "1px dashed var(--border-color)", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "var(--text-sm)" }}>
                <span>Sisa Saldo Setelah Beli:</span>
                <span style={{ color: currentCoins - confirmItem.price < 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                  {currentCoins - confirmItem.price} Coin
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="card card-tint-rose" style={{ padding: "8px 12px", color: "var(--color-danger)", fontSize: "var(--text-xs)", fontWeight: 700, marginBottom: "var(--space-3)" }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setConfirmItem(null)}
                disabled={isProcessing}
                style={{ minHeight: "44px" }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmPurchase}
                disabled={isProcessing || currentCoins < confirmItem.price}
                id="confirm-buy-submit-btn"
                style={{ minHeight: "44px" }}
              >
                {isProcessing ? "Menyimpan ke Cloud..." : "Beli Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. UNLOCK CELEBRATION MODAL */}
      {unlockedCelebrationItem && (
        <div
          className="modal-overlay is-open"
          id="unlock-celebration-modal-overlay"
          onClick={() => setUnlockedCelebrationItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            padding: "var(--space-4)",
            zIndex: 1010
          }}
        >
          <div
            className="card card-tint-cream"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "var(--space-8)",
              borderRadius: "var(--radius-xl)",
              border: "var(--border-md)",
              boxShadow: "var(--shadow-lg)",
              textAlign: "center"
            }}
          >
            <KanciMascot
              expression="celebrating"
              equippedOutfit={unlockedCelebrationItem.type === "outfit" ? unlockedCelebrationItem.id.replace(/^outfit_/, "") : equippedOutfit}
              size="lg"
            />

            <span style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800, color: "#D69E2E", display: "block", marginTop: "var(--space-3)" }}>
              Koleksi Baru Terbuka!
            </span>
            <h3 style={{ fontSize: "var(--text-2xl)", margin: "4px 0 var(--space-2)" }}>
              {unlockedCelebrationItem.name}
            </h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
              Selamat! Item ini kini resmi berada di inventaris akun belajarmu.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => {
                const it = unlockedCelebrationItem;
                setUnlockedCelebrationItem(null);
                if (it.type === "border" || it.type === "outfit") {
                  handleEquip(it, { stopPropagation: () => {} });
                }
              }}
              id="celebration-equip-now-btn"
              style={{ width: "100%" }}
            >
              Gunakan Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
