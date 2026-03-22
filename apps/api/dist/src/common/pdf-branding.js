"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLocalFile = resolveLocalFile;
exports.resolveLogoPath = resolveLogoPath;
exports.addBrandedHeader = addBrandedHeader;
exports.addBrandedFooter = addBrandedFooter;
exports.addBrandedWatermark = addBrandedWatermark;
exports.getBrandedPrimaryColor = getBrandedPrimaryColor;
exports.addReceiptBranding = addReceiptBranding;
exports.addReceiptFooterBranding = addReceiptFooterBranding;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
    ];
}
function resolveLocalFile(url) {
    if (!url)
        return null;
    if (url.startsWith('/api/organization-profile/files/')) {
        const filename = path.basename(url);
        const candidates = [
            path.join(process.cwd(), 'uploads', 'organization', filename),
            path.join(path.resolve(process.cwd(), '..', '..'), 'uploads', 'organization', filename),
        ];
        for (const fp of candidates) {
            if (fs.existsSync(fp))
                return fp;
        }
    }
    return null;
}
function resolveLogoPath(logoUrl) {
    const fromDb = resolveLocalFile(logoUrl);
    if (fromDb)
        return fromDb;
    const workspaceRoot = path.resolve(process.cwd(), '..', '..');
    const fallbacks = [
        path.join(process.cwd(), 'public', 'asha-kuteer-logo.jpg'),
        path.join(workspaceRoot, 'public', 'asha-kuteer-logo.jpg'),
        path.join(workspaceRoot, 'apps', 'web', 'public', 'asha-kuteer-logo.jpg'),
        path.join(workspaceRoot, 'apps', 'web', 'public', 'brand', 'logo.jpg'),
    ];
    for (const fp of fallbacks) {
        if (fs.existsSync(fp))
            return fp;
    }
    return null;
}
function addBrandedHeader(doc, profile, reportTitle, options = {}) {
    const { headerHeight = 80, startY = 40, showDate = true } = options;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const margin = doc.page.margins.left;
    const primaryColor = profile.brandingPrimaryColor || '#2E7D32';
    doc.save();
    doc.rect(margin, startY, pageWidth, headerHeight).fill(primaryColor);
    let logoWidth = 0;
    const logoPath = resolveLogoPath(profile.logoUrl);
    if (logoPath) {
        try {
            const logoBuffer = fs.readFileSync(logoPath);
            doc.image(logoBuffer, margin + 10, startY + 10, { height: headerHeight - 20, fit: [60, headerHeight - 20] });
            logoWidth = 70;
        }
        catch (e) {
            console.error('[PDF Branding] Header logo embed error:', e);
        }
    }
    const textX = margin + 10 + logoWidth;
    const textWidth = pageWidth - 20 - logoWidth;
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text(profile.name, textX, startY + 12, { width: textWidth });
    if (profile.tagline1) {
        doc.fontSize(8).font('Helvetica')
            .text(profile.tagline1, textX, startY + 32, { width: textWidth });
    }
    if (profile.reportHeaderText) {
        doc.fontSize(7).font('Helvetica')
            .text(profile.reportHeaderText, textX, startY + 44, { width: textWidth });
    }
    doc.fontSize(10).font('Helvetica-Bold')
        .text(reportTitle, margin + 10, startY + headerHeight - 22, {
        width: pageWidth - 20,
        align: 'right',
    });
    doc.restore();
    doc.fillColor('#000000');
    let y = startY + headerHeight + 10;
    if (showDate) {
        doc.fontSize(8).font('Helvetica').fillColor('#666666')
            .text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, margin, y, {
            width: pageWidth,
            align: 'right',
        });
        y += 16;
    }
    doc.fillColor('#000000');
    return y;
}
function addBrandedFooter(doc, profile, options = {}) {
    const { showConfidential = true, showPageNumbers = true } = options;
    const pageCount = doc.bufferedPageRange().count;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const margin = doc.page.margins.left;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        const footerY = doc.page.height - 40;
        const primaryColor = profile.brandingPrimaryColor || '#2E7D32';
        doc.save();
        doc.rect(margin, footerY - 5, pageWidth, 1).fill(primaryColor);
        doc.restore();
        const footerParts = [];
        footerParts.push(profile.name);
        if (showConfidential)
            footerParts.push('Confidential');
        if (profile.reportFooterText)
            footerParts.push(profile.reportFooterText);
        if (showPageNumbers)
            footerParts.push(`Page ${i + 1} of ${pageCount}`);
        doc.fillColor('#a0aec0').fontSize(7).font('Helvetica')
            .text(footerParts.join(' | '), margin, footerY, {
            width: pageWidth,
            align: 'center',
        });
    }
}
function addBrandedWatermark(doc, orgName) {
    doc.save();
    doc.fillColor('#f0f0f0').fontSize(50).font('Helvetica-Bold')
        .translate(doc.page.width / 2, doc.page.height / 2)
        .rotate(-45, { origin: [0, 0] })
        .text(orgName, -200, -25, { width: 400, align: 'center' });
    doc.restore();
    doc.fillColor('#000000');
}
function getBrandedPrimaryColor(profile) {
    return profile.brandingPrimaryColor || '#2E7D32';
}
function addReceiptBranding(doc, profile, options) {
    const { margin } = options;
    const primaryColor = profile.brandingPrimaryColor || '#2E7D32';
    const pageWidth = doc.page.width;
    const bannerHeight = 120;
    const bannerY = margin;
    doc.save();
    doc.rect(margin, bannerY, pageWidth - margin * 2, bannerHeight).fill(primaryColor);
    doc.restore();
    let logoEndX = margin + 20;
    const logoPath = resolveLogoPath(profile.logoUrl);
    if (logoPath) {
        try {
            const logoBuffer = fs.readFileSync(logoPath);
            const logoSize = 90;
            const logoY = bannerY + (bannerHeight - logoSize) / 2;
            doc.image(logoBuffer, margin + 20, logoY, { width: logoSize, height: logoSize });
            logoEndX = margin + 20 + logoSize + 16;
        }
        catch (e) {
            console.error('[PDF Branding] Logo embed error:', e);
        }
    }
    const textAreaWidth = pageWidth - margin - 20 - logoEndX;
    const textStartY = bannerY + 18;
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20);
    doc.text(profile.name, logoEndX, textStartY, { width: textAreaWidth });
    if (profile.tagline1) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff');
        doc.text(profile.tagline1, logoEndX, textStartY + 30, { width: textAreaWidth });
    }
    if (profile.tagline2) {
        doc.font('Helvetica').fontSize(10).fillColor('#e8f5e9');
        doc.text(profile.tagline2, logoEndX, textStartY + 48, { width: textAreaWidth });
    }
    if (profile.reportHeaderText) {
        doc.font('Helvetica').fontSize(8).fillColor('#c8e6c9');
        doc.text(profile.reportHeaderText, logoEndX, textStartY + 66, { width: textAreaWidth });
    }
    doc.fillColor('#000000');
    return bannerY + bannerHeight + 18;
}
function addReceiptFooterBranding(doc, profile, options) {
    let { y, contentWidth, margin } = options;
    const primaryColor = profile.brandingPrimaryColor || '#2E7D32';
    doc.save();
    doc.strokeColor(primaryColor).lineWidth(1.5);
    doc.moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
    doc.restore();
    y += 16;
    const signaturePath = resolveLocalFile(profile.signatureImageUrl);
    if (signaturePath) {
        try {
            const sigBuffer = fs.readFileSync(signaturePath);
            doc.image(sigBuffer, margin + contentWidth - 120, y, { width: 100 });
            doc.font('Helvetica').fontSize(8).fillColor('#666666');
            doc.text('Authorized Signatory', margin + contentWidth - 130, y + 55, { width: 120, align: 'center' });
        }
        catch { }
    }
    const contactParts = [];
    const phoneDisplay = profile.phone2
        ? `${profile.phone1} / ${profile.phone2}`
        : profile.phone1;
    if (phoneDisplay)
        contactParts.push(`Tel: ${phoneDisplay}`);
    if (profile.email)
        contactParts.push(`Email: ${profile.email}`);
    if (profile.website)
        contactParts.push(`Web: ${profile.website}`);
    doc.font('Helvetica').fontSize(9).fillColor('#444444');
    for (const part of contactParts) {
        doc.text(part, margin, y, { width: contentWidth - 140 });
        y = doc.y + 2;
    }
    y += 12;
    doc.font('Helvetica').fontSize(8).fillColor('#888888');
    doc.text('This is a system generated receipt.', margin, y, { align: 'center', width: contentWidth });
    y = doc.y + 4;
    if (profile.reportFooterText) {
        doc.fontSize(7).fillColor('#999999');
        doc.text(profile.reportFooterText, margin, y, { align: 'center', width: contentWidth });
        y = doc.y + 4;
    }
    return y;
}
//# sourceMappingURL=pdf-branding.js.map