import React from 'react';
import styles from './styles.module.css';

export interface MenuItem {
  slug: string;
  text: string;
  icon: string;
}

export function MenuDropDown({ items, onItemClick }: { items: MenuItem[]; onItemClick(slug: string): void }) {
  return (
    <div className={styles.menuDropDownWrapper}>
      {items.map((item) => {
        return (
          <MenuDropDownItem
            key={item.slug}
            text={item.text}
            icon={item.icon}
            onClick={() => {
              onItemClick(item.slug);
            }}
          />
        );
      })}
    </div>
  );
}

function MenuDropDownItem({ text, icon, onClick }: { text: string; icon?: string; onClick(): void }) {
  return (
    <div className={styles.menuItemWrapper} onClick={onClick}>
      <div className={styles.iconBox}>{icon ? <img src={icon} alt={`${text} icon`} /> : null}</div>
      <span className={styles.text}>{text}</span>
    </div>
  );
}
