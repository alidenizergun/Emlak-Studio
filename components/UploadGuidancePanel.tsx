'use client';

import { useI18n } from '@/components/LanguageProvider';
import styles from './UploadGuidancePanel.module.css';

export default function UploadGuidancePanel() {
    const { t } = useI18n();

    return (
        <aside className={styles.panel}>
            <p className={styles.title}>{t('Daha iyi sonuç için')}</p>
            <ul className={styles.list}>
                <li>{t('Net ve titreşimsiz fotoğraf kullanın')}</li>
                <li>{t('Oda iyi aydınlatılmış olsun')}</li>
                <li>{t('Duvarlar ve zemin kadrajda açık görünsün')}</li>
                <li>{t('Çok düşük çözünürlüklü veya aşırı sıkıştırılmış görsel kullanmayın')}</li>
            </ul>
        </aside>
    );
}
