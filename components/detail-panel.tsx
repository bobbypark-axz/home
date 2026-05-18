"use client";

import { useState } from "react";
import type { Listing } from "@/lib/types";
import { ELIGIBILITY_LABELS, HOUSING_TYPES, STATUS_LABELS } from "@/lib/mock-data";
import { thumbnailSVG } from "@/lib/svg";
import { calcDday, isRegularRecruitment } from "@/lib/dday";
import {
  applyUrlFor,
  infoUrlFor,
  deepLinksFor,
  complexName,
} from "@/lib/notice-match";
import { NaverPanorama } from "./naver-panorama";
import { CloseIcon, HeartIcon, TrainIcon } from "./icons";

function ListingComplexes({ item }: { item: Listing }) {
  if (!item.complexes || !item.complexes.length) return null;
  function fmtPrice(v: number | null): string {
    if (v == null) return "공고문 확인";
    return Math.round(v / 10000).toLocaleString() + "만원";
  }
  return (
    <section className="detail-section">
      <h3>단지별 공급 정보</h3>
      {item.complexes.map((c, ci) => (
        <div key={ci} style={{ marginTop: ci === 0 ? 0 : 16 }}>
          {c.name && (
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{c.name}</div>
          )}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--seed-scale-color-gray-200)", color: "var(--seed-semantic-color-ink-text-low)" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px" }}>주택형</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>전용면적</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>세대수</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>보증금</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>월세</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map((r, ri) => (
                  <tr key={ri} style={{ borderBottom: "1px solid var(--seed-scale-color-gray-100)" }}>
                    <td style={{ padding: "6px 8px" }}>{r.houseType}</td>
                    <td style={{ textAlign: "right", padding: "6px 8px" }}>{r.area}㎡</td>
                    <td style={{ textAlign: "right", padding: "6px 8px" }}>{r.supplyTotal ?? "-"}</td>
                    <td style={{ textAlign: "right", padding: "6px 8px" }}>{fmtPrice(r.deposit)}</td>
                    <td style={{ textAlign: "right", padding: "6px 8px" }}>{fmtPrice(r.rent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}

function ListingPhotos({ item }: { item: Listing }) {
  const cover = item.coverPhotoUrl;
  if (!cover) return null;
  return (
    <section className="detail-section detail-photos">
      <h3>단지 조감도</h3>
      <a className="detail-photo-card" href={cover} target="_blank" rel="noreferrer">
        <div className="detail-photo-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="detail-photo-img"
            src={cover}
            alt={`${item.title} 단지 조감도`}
            referrerPolicy="no-referrer"
          />
        </div>
      </a>
    </section>
  );
}

export function DetailPanel({
  item,
  open,
  onClose,
}: {
  item: Listing | null | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const [liked, setLiked] = useState(false);
  if (!item) return <div className={`detail-panel ${open ? "open" : ""}`} />;

  const svg = thumbnailSVG(item.thumbSeed, item.type);
  const status = STATUS_LABELS[item.status];
  const housingType = HOUSING_TYPES.find((t) => t.id === item.type);
  const applyUrl = applyUrlFor(item.type);
  const infoUrl = infoUrlFor(item.type);
  const deepLinks = deepLinksFor(item);
  const complex = complexName(item);
  const hasNotice = Boolean(item.deadline);
  // 청약 신청 버튼 상태: 신청 가능한 시점인지에 따라 라벨/활성 결정
  const isRecurring = isRegularRecruitment(item.deadline, item.status);
  const applyButton: { label: string; active: boolean } = isRecurring
    ? { label: "공고 확인 →", active: true }
    : item.status === "open" || item.status === "closing"
      ? { label: "청약 신청하기 →", active: true }
      : item.status === "upcoming"
        ? { label: "접수 예정", active: false }
        : { label: "접수 마감", active: false };

  return (
    <aside className={`detail-panel ${open ? "open" : ""}`}>
      <button className="detail-close" onClick={onClose}>
        <CloseIcon size={16} />
      </button>

      <div className="detail-hero">
        <NaverPanorama
          lat={item.lat}
          lng={item.lng}
          fallback={
            <div
              style={{ width: "100%", height: "100%" }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          }
        />
      </div>

      <div className="detail-body">
        <div className="detail-eyebrow">
          <span className="detail-agency-tag">
            {item.agency} · {item.district}
          </span>
        </div>
        <h1 className="detail-title">{item.title}</h1>
        <div className="detail-address">{item.address}</div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {housingType && (
            <span className={`badge ${housingType.badge}`} style={{ fontSize: 12, padding: "4px 9px" }}>
              {housingType.name}
            </span>
          )}
          <span className="badge agency" style={{ fontSize: 12, padding: "4px 9px" }}>
            {item.agency} 공급
          </span>
          <span
            className="badge"
            style={{
              fontSize: 12,
              padding: "4px 9px",
              background: status.color + "22",
              color: status.color,
            }}
          >
            · {status.text}
          </span>
        </div>

        {isRegularRecruitment(item.deadline, item.status) ? (
          <div className="detail-empty-notice">
            <div className="detail-empty-notice-title">정례모집 단지</div>
            <div className="detail-empty-notice-sub">
              이 단지는 정해진 회차마다 모집해요. 현재 회차 접수가 끝났더라도 다음 회차에 다시 신청할 수 있습니다. 일정은 &lsquo;LH 청약플러스&rsquo;에서 확인하세요.
            </div>
          </div>
        ) : item.deadline ? (
          <div className="detail-deadline">
            <div>
              <div className="detail-deadline-label">모집 마감</div>
              <div className="detail-deadline-date">{item.deadline.replace(/\./g, ". ")} 18:00까지</div>
            </div>
            <div className="detail-deadline-dday">{calcDday(item.deadline)}</div>
          </div>
        ) : (
          <div className="detail-empty-notice">
            <div className="detail-empty-notice-title">현재 단지별 모집 공고 없음</div>
            <div className="detail-empty-notice-sub">
              공실 발생 시 LH/마이홈에서 별도 공고됩니다. 아래 버튼으로 직접 확인하세요.
            </div>
          </div>
        )}

        <ListingPhotos item={item} />
        <ListingComplexes item={item} />

        <section className="detail-section detail-vacancy-search">
          <h3>이 단지 공실·모집 공고 알아보기</h3>
          <div className="detail-vacancy-grid">
            <a className="vacancy-link" href={deepLinks.lhNoticeSearch} target="_blank" rel="noreferrer">
              <span className="vacancy-link-label">LH 청약플러스</span>
              <span className="vacancy-link-sub">공고문 원문 보기 「{complex}」</span>
            </a>
            <a className="vacancy-link" href={deepLinks.lhComplexSearch} target="_blank" rel="noreferrer">
              <span className="vacancy-link-label">LH 임대주택검색</span>
              <span className="vacancy-link-sub">{item.district} 단지 정보</span>
            </a>
            <a className="vacancy-link" href={deepLinks.myhomeSearch} target="_blank" rel="noreferrer">
              <span className="vacancy-link-label">마이홈포털</span>
              <span className="vacancy-link-sub">통합 모집공고 검색</span>
            </a>
          </div>
          {!hasNotice ? (
            <div className="detail-vacancy-hint">
              ※ 단지명·지역으로 사전 필터된 검색 결과로 이동합니다.
            </div>
          ) : null}
        </section>

        {item.type === "sale" ? (
          <div className="detail-price">
            <div className="detail-price-cell detail-price-cell--full">
              <div className="detail-price-label">분양가 (평균)</div>
              <div className="detail-price-value">
                {item.salePriceManwon && item.salePriceManwon > 0
                  ? `${Math.floor(item.salePriceManwon / 10000) > 0 ? `${Math.floor(item.salePriceManwon / 10000)}억 ` : ""}${(item.salePriceManwon % 10000).toLocaleString()}만원`
                  : "공고문 확인"}
              </div>
            </div>
          </div>
        ) : (
          <div className="detail-price">
            <div className="detail-price-cell">
              <div className="detail-price-label">보증금</div>
              <div className="detail-price-value">{item.deposit.toLocaleString()}만원</div>
            </div>
            <div className="detail-price-cell">
              <div className="detail-price-label">월 임대료</div>
              <div className="detail-price-value">{item.rent}만원</div>
            </div>
          </div>
        )}

        <section className="detail-section">
          <h3>입주 자격</h3>
          <div className="detail-eligibility">
            {item.eligible.map((e) => (
              <span key={e} className="eli-pill">
                {ELIGIBILITY_LABELS[e] ?? e}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "var(--seed-semantic-color-ink-text-low)", marginTop: 8, lineHeight: 1.6 }}>
            · 정확한 자격 요건은 LH 공고문을 반드시 확인하세요.
            {item.sourceUrl && (
              <>
                {" "}
                <a href={item.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--seed-semantic-color-primary)", textDecoration: "underline" }}>
                  공고문 보기 →
                </a>
              </>
            )}
          </div>
        </section>

        <section className="detail-section">
          <h3>기본 정보</h3>
          <dl className="detail-specs">
            {item.pblancNm ? (
              <>
                <dt>공고명</dt>
                <dd>{item.pblancNm}</dd>
              </>
            ) : null}
            {item.suplyTyNm ? (
              <>
                <dt>공급 유형</dt>
                <dd>{item.suplyTyNm}</dd>
              </>
            ) : null}
            {item.totalUnits ? (
              <>
                <dt>총 세대 수</dt>
                <dd>{item.totalUnits}세대</dd>
              </>
            ) : null}
            {item.supplyUnits ? (
              <>
                <dt>공급 세대 수</dt>
                <dd>{item.supplyUnits}세대</dd>
              </>
            ) : null}
            {item.heatMethod ? (
              <>
                <dt>난방</dt>
                <dd>{item.heatMethod}</dd>
              </>
            ) : null}
            {item.beginDate ? (
              <>
                <dt>접수 시작</dt>
                <dd>{item.beginDate}</dd>
              </>
            ) : null}
            {item.deadline ? (
              <>
                <dt>접수 마감</dt>
                <dd>{item.deadline}</dd>
              </>
            ) : null}
          </dl>
        </section>

        <section className="detail-section">
          <h3>입지·편의</h3>
          <div className="detail-feat-row">
            <div className="feat-chip">
              <TrainIcon size={12} />
              {item.transit}
            </div>
            {item.features.map((f) => (
              <div key={f} className="feat-chip">
                #{f}
              </div>
            ))}
            {item.competition != null && (
              <div
                className="feat-chip"
                style={{
                  borderColor: "var(--seed-scale-color-carrot-200)",
                  background: "var(--seed-semantic-color-primary-low)",
                  color: "var(--seed-scale-color-carrot-700)",
                  fontWeight: 600,
                }}
              >
                지난 회차 경쟁률 {item.competition}:1
              </div>
            )}
          </div>
        </section>

        <section className="detail-section">
          <h3>신청 방법</h3>
          <ol
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 13,
              lineHeight: 1.75,
              color: "var(--seed-semantic-color-ink-text)",
            }}
          >
            <li>{item.agency} 청약 플랫폼에서 회원가입 및 공인인증</li>
            <li>모집공고 기간 내 온라인 청약 신청서 제출</li>
            <li>서류 제출 (주민등록, 소득 증빙 등)</li>
            <li>소득·자산 조사 및 당첨자 발표</li>
            <li>계약 체결 및 입주</li>
          </ol>
        </section>

        <div className="detail-actions">
          <button
            className={`icon-btn ${liked ? "active" : ""}`}
            onClick={() => setLiked(!liked)}
            aria-label="관심 목록"
          >
            <HeartIcon size={20} filled={liked} />
          </button>
          <a
            className="secondary"
            href={item.sourceUrl ?? infoUrl}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            공고문 원문 보기
          </a>
          {applyButton.active ? (
            <a
              className="primary"
              href={applyUrl}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {applyButton.label}
            </a>
          ) : (
            <button
              className="primary disabled"
              disabled
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {applyButton.label}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
