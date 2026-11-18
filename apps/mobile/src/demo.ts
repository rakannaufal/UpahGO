import {
  canTransitionAgreement,
  validateProfile,
  profileReady,
  cloneData,
  radiusOptions,
  validateProfilePrice,
  historyPageSize,
} from "../../../shared/contracts.ts";
import {
  distanceKm,
  inCity,
  locationFresh,
  validateLocation,
  validateReview,
} from "../../../shared/geo.ts";
import {
  demoCity,
  demoArea,
  demoAreas,
  demoLocation,
  seedProfiles,
  demoTags,
} from "./demo-data.ts";
import type {
  Account,
  Api,
  ActionArgs,
  ActionResults,
  Operation,
  Profile,
  Person,
  Contact,
  Agreement,
  Notice,
  Review,
  JobSuggestion,
} from "../../../shared/contracts";
import {
  estimateEffort,
  validateWorkContext,
  validateEfforts,
  jobs,
  categories,
  matchesJobSearch,
  validateJobSuggestion,
} from "../../../shared/jobs.ts";
export {
  demoCity,
  demoArea,
  demoAreas,
  demoLocation,
  demoTags,
} from "./demo-data.ts";
let sequence = 0;
const demoId = () => `demo-record-${++sequence}`;
const future = () => new Date(Date.now() + 3600000).toISOString();
export class DemoApi implements Api {
  actor = "demo-me";
  profiles: Profile[] = seedProfiles();
  accounts: Record<string, Account> = {};
  roleProfiles: Record<
    string,
    Pick<
      Profile,
      | "tags"
      | "bio"
      | "acceptedEfforts"
      | "workContext"
      | "priceAmount"
      | "priceNegotiable"
    >
  > = {};
  contacts: Contact[] = [];
  agreements: Agreement[] = [];
  notices: (Notice & { recipient: string })[] = [];
  blocks = new Set<string>();
  photos: Record<string, string> = {};
  suggestions: (JobSuggestion & { userId: string })[] = [];
  reviews: (Review & {
    reviewerId: string;
    targetId: string;
    targetRole: string;
  })[] = [];
  constructor() {
    this.profiles.push({
      ...this.profiles[0]!,
      id: "demo-me",
      name: "Rakan Demo",
      visibleUntil: null,
    });
    for (const p of this.profiles)
      this.accounts[p.id] = {
        id: p.id,
        role: p.role,
        introSeen: true,
        setupDone: true,
        browseAreaId: demoArea.id,
        status: "active",
        location: demoLocation(),
      };
    this.accounts["demo-me"] = {
      id: "demo-me",
      role: null,
      introSeen: false,
      setupDone: false,
      browseAreaId: null,
      status: "active",
      location: null,
    };
    this.roleProfiles["demo-me:employer"] = {
      tags: ["sweep", "mop"],
      bio: "Butuh bantuan merapikan rumah.",
      priceAmount: 120000,
      priceNegotiable: true,
    };
    // All names, work records and reviews below are explicitly synthetic demo data.
    const workers = this.profiles.filter((p) => p.role === "worker");
    const employers = this.profiles.filter((p) => p.role === "employer");
    for (let i = 0; i < workers.length; i++) {
      const w = workers[i]!,
        e = employers[(i + 1) % employers.length]!;
      const createdAt = new Date(Date.now() - (i + 1) * 86400000).toISOString();
      const contact: Contact = {
        id: `seed-contact-${i}`,
        senderId: e.id,
        receiverId: w.id,
        senderName: e.name,
        receiverName: w.name,
        senderRole: "employer",
        receiverRole: "worker",
        status: "accepted",
        createdAt,
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      };
      this.contacts.push(contact);
      const g: Agreement = {
        id: `seed-work-${i}`,
        contactId: contact.id,
        workerId: w.id,
        employerId: e.id,
        creatorId: e.id,
        workerName: w.name,
        employerName: e.name,
        title: ["Bersih dapur mingguan", "Rapikan rumah", "Bersihkan jendela"][
          i % 3
        ]!,
        tasks: "Menyapu, mengepel, dan merapikan area yang disepakati.",
        wage: 120000 + i * 15000,
        startsAt: createdAt,
        timezone: "Asia/Jakarta",
        status: "completed",
        paymentReceivedAt: createdAt,
        createdAt,
      };
      this.agreements.push(g);
      this.reviews.push({
        id: `seed-review-worker-${i}`,
        agreementId: g.id,
        reviewerId: e.id,
        targetId: w.id,
        targetRole: "worker",
        reviewerName: e.name,
        score: i % 3 ? 5 : 4,
        comment: "Pekerjaan rapi dan sesuai kesepakatan.",
        createdAt,
      });
      if (w.id !== "demo-me")
        this.reviews.push({
          id: `seed-review-employer-${i}`,
          agreementId: g.id,
          reviewerId: w.id,
          targetId: e.id,
          targetRole: "employer",
          reviewerName: w.name,
          score: 5,
          comment: "Tugas jelas, upah dibayar sesuai kesepakatan.",
          createdAt,
        });
      this.notice(
        w.id,
        "Pekerjaan selesai, beri penilaian",
        `/agreement/${g.id}`,
      );
      this.notice(e.id, "Uang tunai sudah diterima", `/agreement/${g.id}`);
    }
    const w = this.profiles.find((p) => p.id === "demo-me")!;
    const e = employers[0]!;
    this.contacts.unshift({
      id: "seed-incoming",
      senderId: e.id,
      receiverId: w.id,
      senderName: e.name,
      receiverName: w.name,
      senderRole: "employer",
      receiverRole: "worker",
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: future(),
    });
    this.notice(
      w.id,
      "Permintaan kontak dari Rumah Bu Rina",
      "/contact/seed-incoming",
    );
    const activeEmployer = employers[3]!;
    this.contacts.unshift({
      id: "seed-active-contact",
      senderId: activeEmployer.id,
      receiverId: w.id,
      senderName: activeEmployer.name,
      receiverName: w.name,
      senderRole: "employer",
      receiverRole: "worker",
      status: "accepted",
      createdAt: new Date().toISOString(),
      expiresAt: future(),
    });
    this.agreements.unshift({
      id: "seed-active-work",
      contactId: "seed-active-contact",
      workerId: w.id,
      employerId: activeEmployer.id,
      creatorId: activeEmployer.id,
      workerName: w.name,
      employerName: activeEmployer.name,
      title: "Bersihkan rumah sore ini",
      tasks: "Menyapu dan mengepel ruang utama. Alat disediakan.",
      wage: 150000,
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      timezone: "Asia/Jakarta",
      status: "agreed",
      paymentReceivedAt: null,
      createdAt: new Date().toISOString(),
    });
    this.notice(w.id, "Jadwal kerja disepakati", "/agreement/seed-active-work");
  }
  account() {
    return this.accounts[this.actor]!;
  }
  profile() {
    return this.profiles.find((p) => p.id === this.actor) ?? null;
  }
  person(p: Profile): Person {
    const area = demoAreas.find((x) => x.id === p.areaId) ?? demoArea;
    const ratings = this.reviews.filter(
      (r) => r.targetId === p.id && r.targetRole === p.role,
    );
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      areaId: area.id,
      areaLabel: area.label,
      latitude: area.latitude,
      longitude: area.longitude,
      tags: p.tags,
      bio: p.bio,
      expiresAt: p.visibleUntil!,
      distanceKm:
        Math.round(
          distanceKm(this.account().location ?? demoLocation(), area) * 10,
        ) / 10,
      ratingAverage: ratings.length
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : null,
      ratingCount: ratings.length,
      acceptedEfforts: p.acceptedEfforts ?? [],
      workContext: p.workContext ?? null,
      effort: estimateEffort(p.tags, p.workContext),
      priceAmount: p.priceAmount ?? null,
      priceNegotiable: p.priceNegotiable ?? false,
    };
  }
  blocked(a: string, b: string) {
    return this.blocks.has(`${a}:${b}`) || this.blocks.has(`${b}:${a}`);
  }
  notice(recipient: string, title: string, route: string) {
    this.notices.unshift({
      id: demoId(),
      title,
      body: "Pembaruan simulasi.",
      route,
      read: false,
      createdAt: new Date().toISOString(),
      recipient,
    });
  }
  async call<K extends Operation>(
    op: K,
    args: ActionArgs = {},
  ): Promise<ActionResults[K]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return cloneData(this.execute(op, args)) as ActionResults[K];
  }
  execute(op: Operation, a: ActionArgs): unknown {
    const account = this.account();
    const p = this.profile();
    const id = String(a.id);
    const target = this.profiles.find((x) => x.id === a.targetId);
    if (op === "bootstrap")
      return {
        account,
        profile: p,
        areas: demoAreas,
        tags: demoTags,
        city: account.location ? demoCity : null,
      };
    if (op === "request_deletion" && account.status === "deletion_requested") {
      if (a.confirm !== true) throw new Error("CONSENT_REQUIRED");
      return { ok: true };
    }
    if (account.status !== "active") throw new Error("ACCOUNT_RESTRICTED");
    if (op === "onboarding") {
      if (a.step === "intro") account.introSeen = true;
      else if (a.step === "profile" && account.role) account.setupDone = true;
      else throw new Error("INVALID_INPUT");
      return account;
    }
    if (op === "set_role") {
      if (a.role !== "worker" && a.role !== "employer")
        throw new Error("INVALID_INPUT");
      if (account.role !== a.role) {
        if (p) {
          this.roleProfiles[`${p.id}:${p.role}`] = {
            tags: [...p.tags],
            bio: p.bio,
            acceptedEfforts: p.acceptedEfforts,
            workContext: p.workContext,
            priceAmount: p.priceAmount,
            priceNegotiable: p.priceNegotiable,
          };
          const saved = this.roleProfiles[`${p.id}:${a.role}`];
          Object.assign(p, {
            role: a.role,
            tags: saved?.tags ?? [],
            bio: saved?.bio ?? "",
            acceptedEfforts: saved?.acceptedEfforts ?? [],
            workContext: saved?.workContext ?? null,
            priceAmount: saved?.priceAmount ?? null,
            priceNegotiable: saved?.priceNegotiable ?? false,
            photoStatus: this.photos[`${p.id}:${a.role}`] ? "pending" : null,
            visibleUntil: null,
          });
        }
        account.role = a.role;
      }
      return account;
    }
    if (op === "set_area") {
      if (!account.location) throw new Error("LOCATION_REQUIRED");
      if (a.areaId !== null && !demoAreas.some((x) => x.id === a.areaId))
        throw new Error("AREA_REQUIRED");
      account.browseAreaId = a.areaId as string | null;
      return account;
    }
    if (op === "set_location") {
      const point = {
        latitude: Number(a.latitude),
        longitude: Number(a.longitude),
        accuracyMeters: Number(a.accuracyMeters),
        capturedAt: String(a.capturedAt),
      };
      validateLocation(point);
      if (!inCity(demoCity, point.latitude, point.longitude))
        throw new Error("CITY_UNAVAILABLE");
      const radiusKm = Number(a.radiusKm);
      if (!(radiusOptions as readonly number[]).includes(radiusKm))
        throw new Error("RADIUS_INVALID");
      account.location = {
        ...point,
        latitude: Math.round(point.latitude * 1000) / 1000,
        longitude: Math.round(point.longitude * 1000) / 1000,
        radiusKm,
        cityId: demoCity.id,
      };
      account.browseAreaId = null;
      return account;
    }
    if (op === "set_radius") {
      if (!locationFresh(account.location))
        throw new Error("LOCATION_REQUIRED");
      const radiusKm = Number(a.radiusKm);
      if (!(radiusOptions as readonly number[]).includes(radiusKm))
        throw new Error("RADIUS_INVALID");
      account.location!.radiusKm = radiusKm;
      return account;
    }
    if (op === "request_deletion") {
      if (a.confirm !== true) throw new Error("CONSENT_REQUIRED");
      account.status = "deletion_requested";
      if (p) {
        p.status = "deletion_requested";
        p.visibleUntil = null;
      }
      this.contacts
        .filter((c) => [c.senderId, c.receiverId].includes(account.id))
        .forEach((c) => (c.status = "revoked"));
      return { ok: true };
    }
    if (!account.role) throw new Error("ROLE_REQUIRED");
    if (op === "photo_access") return { key: null, status: null };
    if (op === "job_suggestions")
      return this.suggestions
        .filter((s) => s.userId === account.id)
        .map(({ userId: _userId, ...s }) => s);
    if (op === "suggest_job") {
      const title = String(a.title ?? "").trim(),
        detail = String(a.detail ?? "").trim();
      validateJobSuggestion(title, detail);
      validateWorkContext(a.workContext);
      const suggestion = {
        id: demoId(),
        userId: account.id,
        title,
        detail,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
      };
      this.suggestions.unshift(suggestion);
      return suggestion;
    }
    if (op === "discover" || op === "profile") {
      if (!locationFresh(account.location))
        throw new Error("LOCATION_REQUIRED");
      const people = this.profiles.filter(
        (x) =>
          x.id !== account.id &&
          x.role === a.role &&
          x.visibleUntil &&
          Date.parse(x.visibleUntil) > Date.now() &&
          x.status === "active" &&
          this.person(x).distanceKm <= account.location!.radiusKm &&
          !this.blocked(x.id, account.id),
      );
      if (op === "discover") {
        if (
          (a.query != null &&
            (typeof a.query !== "string" || a.query.length > 80)) ||
          (a.effort &&
            !["light", "medium", "heavy", "unknown"].includes(
              String(a.effort),
            )) ||
          (a.category && !categories.some((c) => c.id === a.category)) ||
          (a.sort && !["distance", "rating"].includes(String(a.sort))) ||
          (a.offset != null &&
            (!Number.isInteger(a.offset) ||
              Number(a.offset) < 0 ||
              Number(a.offset) > 1000))
        )
          throw new Error("FILTER_INVALID");
        return people
          .filter((x) => !a.areaId || x.areaId === a.areaId)
          .map((x) => this.person(x))
          .filter((x) => !a.tag || x.tags.includes(String(a.tag)))
          .filter(
            (x) =>
              !a.category ||
              x.tags.some((t) =>
                jobs.some((j) => j.id === t && j.categoryId === a.category),
              ),
          )
          .filter(
            (x) =>
              !a.query || matchesJobSearch(x.tags, x.name, String(a.query)),
          )
          .filter(
            (x) =>
              !a.effort ||
              (x.role === "worker"
                ? x.acceptedEfforts?.includes(a.effort as "light")
                : x.effort === a.effort),
          )
          .sort(
            (x, y) =>
              (a.sort === "rating"
                ? (y.ratingAverage ?? -1) - (x.ratingAverage ?? -1)
                : 0) ||
              x.distanceKm - y.distanceKm ||
              x.id.localeCompare(y.id),
          )
          .slice(Number(a.offset ?? 0), Number(a.offset ?? 0) + 40);
      }
      const found = people.find((x) => x.id === id);
      if (!found) throw new Error("UNAVAILABLE");
      return this.person(found);
    }
    if (op === "save_profile") {
      const priceAmount =
        "priceAmount" in a ? a.priceAmount : (p?.priceAmount ?? null);
      const priceNegotiable =
        "priceAmount" in a
          ? "priceNegotiable" in a
            ? a.priceNegotiable
            : false
          : (p?.priceNegotiable ?? false);
      if (!("priceAmount" in a) && "priceNegotiable" in a)
        throw new Error("PRICE_INVALID");
      validateProfilePrice(priceAmount, priceNegotiable);
      const updated = {
        name: String(a.name ?? "").trim(),
        region: String(a.region ?? "").trim(),
        tags: a.tags as string[],
        bio: String(a.bio ?? "").trim(),
        acceptedEfforts: validateEfforts(a.acceptedEfforts ?? []),
        workContext: validateWorkContext(a.workContext),
        priceAmount: priceAmount as number | null,
        priceNegotiable: priceNegotiable as boolean,
      };
      validateProfile(updated);
      if (a.role !== account.role) throw new Error("PROFILE_INVALID");
      if (updated.tags.some((t) => !demoTags.some((tag) => tag.id === t)))
        throw new Error("TAGS_INVALID");
      const value = {
        ...updated,
        id: account.id,
        areaId: demoAreas.some((x) => x.id === a.areaId)
          ? String(a.areaId)
          : null,
        role: account.role,
        visibleUntil: null,
        status: "active" as const,
        whatsappReady: p?.whatsappReady ?? false,
      };
      if (p) Object.assign(p, value);
      else this.profiles.push(value);
      account.setupDone = true;
      return value;
    }
    if (op === "contacts" || op === "contact") {
      const contacts = this.contacts
        .filter((c) => [c.senderId, c.receiverId].includes(account.id))
        .map((c) => ({
          ...c,
          status:
            ["accepted", "pending"].includes(c.status) &&
            Date.parse(c.expiresAt) <= Date.now()
              ? ("expired" as const)
              : c.status,
        }));
      if (op === "contact") {
        const contact = contacts.find((c) => c.id === id);
        if (!contact) throw new Error("UNAVAILABLE");
        return contact;
      }
      if (
        (a.targetId !== undefined || a.targetRole !== undefined) &&
        (typeof a.targetId !== "string" ||
          !["worker", "employer"].includes(String(a.targetRole)))
      )
        throw new Error("INVALID_INPUT");
      return historyPage(
        contacts.filter(
          (c) =>
            (!a.targetId ||
              (c.senderId === account.id &&
                c.receiverId === a.targetId &&
                c.senderRole === account.role &&
                c.receiverRole === a.targetRole) ||
              (c.receiverId === account.id &&
                c.senderId === a.targetId &&
                c.receiverRole === account.role &&
                c.senderRole === a.targetRole)) &&
            (!a.filter ||
              a.filter === "all" ||
              (a.filter === "active") ===
                ["pending", "accepted"].includes(c.status)),
        ),
        a,
      );
    }
    if (op === "agreements" || op === "agreement") {
      const agreements = this.agreements.filter((g) =>
        [g.workerId, g.employerId].includes(account.id),
      );
      if (op === "agreement") {
        const agreement = agreements.find((g) => g.id === id);
        if (!agreement) throw new Error("UNAVAILABLE");
        return agreement;
      }
      return historyPage(
        agreements.filter(
          (g) =>
            !a.filter ||
            a.filter === "all" ||
            (a.filter === "active") ===
              !["completed", "cancelled"].includes(g.status),
        ),
        a,
      );
    }
    if (op === "notifications")
      return historyPage(
        this.notices.filter((n) => n.recipient === account.id),
        a,
      );
    if (op === "reviews") {
      this.execute("profile", { id: a.id, role: a.role });
      return this.reviews
        .filter((r) => r.targetId === a.id && r.targetRole === a.role)
        .slice(0, 30)
        .map(
          ({ id, agreementId, reviewerName, score, comment, createdAt }) => ({
            id,
            agreementId,
            reviewerName,
            score,
            comment,
            createdAt,
          }),
        );
    }
    if (op === "agreement_reviews" || op === "submit_review") {
      const work = this.agreements.find(
        (g) => g.id === id && [g.workerId, g.employerId].includes(account.id),
      );
      if (!work) throw new Error("UNAVAILABLE");
      const submitted =
        this.reviews.find(
          (r) => r.agreementId === id && r.reviewerId === account.id,
        ) ?? null;
      if (op === "agreement_reviews")
        return {
          submitted,
          received:
            this.reviews.find(
              (r) => r.agreementId === id && r.targetId === account.id,
            ) ?? null,
        };
      if (work.status !== "completed") throw new Error("REVIEW_NOT_ALLOWED");
      validateReview(Number(a.score), String(a.comment ?? "").trim());
      if (submitted) throw new Error("REVIEW_EXISTS");
      const worker = account.id === work.workerId;
      const review = {
        id: demoId(),
        agreementId: id,
        reviewerId: account.id,
        targetId: worker ? work.employerId : work.workerId,
        targetRole: worker ? "employer" : "worker",
        reviewerName: p?.name ?? "Akun demo",
        score: Number(a.score),
        comment: String(a.comment ?? "").trim(),
        createdAt: new Date().toISOString(),
      };
      this.reviews.unshift(review);
      this.notice(
        review.targetId,
        "Penilaian baru diterima",
        `/agreement/${id}`,
      );
      return review;
    }
    if (!p) throw new Error("PROFILE_INCOMPLETE");
    if (
      op === "request_contact" ||
      (op === "respond_contact" && a.action === "accept") ||
      (op === "visibility" && a.enabled)
    ) {
      if (!profileReady(p)) throw new Error("PROFILE_INCOMPLETE");
      if (!p.whatsappReady) throw new Error("PHONE_REQUIRED");
      if (!locationFresh(account.location))
        throw new Error("LOCATION_REQUIRED");
    }
    const contact = this.contacts.find(
      (c) => c.id === id && [c.senderId, c.receiverId].includes(p.id),
    );
    const g = this.agreements.find(
      (g) => g.id === id && [g.workerId, g.employerId].includes(p.id),
    );
    switch (op) {
      case "visibility":
        p.visibleUntil = a.enabled ? future() : null;
        return p;
      case "request_contact": {
        if (
          !target ||
          target.id === p.id ||
          target.role === account.role ||
          this.blocked(target.id, p.id) ||
          !target.visibleUntil ||
          Date.parse(target.visibleUntil) <= Date.now()
        )
          throw new Error("UNAVAILABLE");
        if (!target.whatsappReady) throw new Error("TARGET_PHONE_REQUIRED");
        if (a.consent !== true) throw new Error("CONSENT_REQUIRED");
        const existing = this.contacts.find(
          (c) =>
            [c.senderId, c.receiverId].includes(p.id) &&
            [c.senderId, c.receiverId].includes(target.id) &&
            ["pending", "accepted"].includes(c.status) &&
            Date.parse(c.expiresAt) > Date.now(),
        );
        if (existing) {
          if (existing.receiverId === p.id && existing.status === "pending")
            throw new Error("INCOMING_REQUEST");
          return existing;
        }
        const c: Contact = {
          id: demoId(),
          senderId: p.id,
          receiverId: target.id,
          senderName: p.name,
          receiverName: target.name,
          senderRole: p.role,
          receiverRole: target.role,
          status: "pending",
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString(),
        };
        this.contacts.unshift(c);
        this.notice(target.id, "Permintaan kontak baru", `/contact/${c.id}`);
        return c;
      }
      case "respond_contact":
        if (
          !contact ||
          contact.receiverId !== p.id ||
          this.blocked(contact.senderId, p.id)
        )
          throw new Error("FORBIDDEN");
        if (
          contact.status !== "pending" ||
          Date.parse(contact.expiresAt) <= Date.now()
        )
          throw new Error("STATE_CONFLICT");
        if (a.action === "accept" && a.consent !== true)
          throw new Error("CONSENT_REQUIRED");
        contact.status = a.action === "accept" ? "accepted" : "declined";
        if (contact.status === "accepted")
          contact.expiresAt = new Date(
            Date.now() + 30 * 86400000,
          ).toISOString();
        this.notice(
          contact.senderId,
          "Permintaan kontak diperbarui",
          `/contact/${contact.id}`,
        );
        return contact;
      case "revoke_contact":
        if (!contact) throw new Error("UNAVAILABLE");
        contact.status = contact.status === "pending" ? "cancelled" : "revoked";
        return contact;
      case "approved_contact":
        throw new Error("DEMO_NO_EXTERNAL_CONTACT");
      case "create_agreement": {
        const c = this.contacts.find(
          (c) =>
            c.id === a.contactId &&
            [c.senderId, c.receiverId].includes(p.id) &&
            c.status === "accepted" &&
            Date.parse(c.expiresAt) > Date.now() &&
            !this.blocked(c.senderId, c.receiverId),
        );
        if (!c) throw new Error("FORBIDDEN");
        if (
          this.agreements.some(
            (g) =>
              g.contactId === c.id &&
              ["proposed", "agreed", "completion_requested"].includes(g.status),
          )
        )
          throw new Error("STATE_CONFLICT");
        if (
          String(a.title).trim().length < 3 ||
          String(a.title).length > 100 ||
          String(a.tasks).trim().length < 10 ||
          String(a.tasks).length > 1000 ||
          !Number.isInteger(a.wage) ||
          Number(a.wage) < 1000 ||
          Number(a.wage) > 50000000 ||
          !Number.isFinite(Date.parse(String(a.startsAt))) ||
          Date.parse(String(a.startsAt)) <= Date.now() ||
          !["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"].includes(
            String(a.timezone),
          )
        )
          throw new Error("AGREEMENT_INVALID");
        const g: Agreement = {
          id: demoId(),
          contactId: c.id,
          workerId: c.senderRole === "worker" ? c.senderId : c.receiverId,
          employerId: c.senderRole === "employer" ? c.senderId : c.receiverId,
          creatorId: p.id,
          workerName: c.senderRole === "worker" ? c.senderName : c.receiverName,
          employerName:
            c.senderRole === "employer" ? c.senderName : c.receiverName,
          title: String(a.title).trim(),
          tasks: String(a.tasks).trim(),
          wage: Number(a.wage),
          startsAt: String(a.startsAt),
          timezone: String(a.timezone),
          status: "proposed",
          paymentReceivedAt: null,
          createdAt: new Date().toISOString(),
          workContext: validateWorkContext(a.workContext),
        };
        this.agreements.unshift(g);
        this.notice(
          p.id === g.workerId ? g.employerId : g.workerId,
          "Tinjau kesepakatan kerja",
          `/agreement/${g.id}`,
        );
        return g;
      }
      case "agreement_action":
        if (!g || !canTransitionAgreement(g, p.id, String(a.action)))
          throw new Error("STATE_CONFLICT");
        if (a.action === "acknowledge_payment")
          g.paymentReceivedAt = new Date().toISOString();
        else
          g.status = (
            {
              accept: "agreed",
              cancel: "cancelled",
              request_completion: "completion_requested",
              confirm_completion: "completed",
            } as const
          )[a.action as "accept"];
        this.notice(
          p.id === g.workerId ? g.employerId : g.workerId,
          "Status pekerjaan diperbarui",
          `/agreement/${g.id}`,
        );
        return g;
      case "read_notification": {
        const n = this.notices.find((n) => n.id === id && n.recipient === p.id);
        if (!n) throw new Error("UNAVAILABLE");
        n.read = true;
        return { ok: true };
      }
      case "block":
        if (!target) throw new Error("UNAVAILABLE");
        this.blocks.add(`${p.id}:${target.id}`);
        this.contacts
          .filter(
            (c) =>
              [c.senderId, c.receiverId].includes(target.id) &&
              [c.senderId, c.receiverId].includes(p.id),
          )
          .forEach((c) => (c.status = "revoked"));
        return { ok: true };
      case "unblock":
        if (target) this.blocks.delete(`${p.id}:${target.id}`);
        return { ok: true };
      case "report":
        if (
          !target ||
          String(a.detail).trim().length < 10 ||
          String(a.detail).length > 1000
        )
          throw new Error("REPORT_INVALID");
        return { id: demoId() };
    }
  }
}

function historyPage<T extends { id: string; createdAt: string }>(
  items: T[],
  args: ActionArgs,
): T[] {
  if (
    args.filter !== undefined &&
    !["all", "active", "history"].includes(String(args.filter))
  )
    throw new Error("INVALID_INPUT");
  let after: { id: string; createdAt: string } | undefined;
  if (args.after !== undefined) {
    const cursor = args.after as Record<string, unknown> | null;
    if (
      !cursor ||
      typeof cursor !== "object" ||
      Array.isArray(cursor) ||
      Object.keys(cursor).some((key) => !["id", "createdAt"].includes(key)) ||
      typeof cursor.id !== "string" ||
      !cursor.id ||
      typeof cursor.createdAt !== "string" ||
      !Number.isFinite(Date.parse(cursor.createdAt))
    )
      throw new Error("INVALID_INPUT");
    after = { id: cursor.id, createdAt: cursor.createdAt };
  }
  return items
    .filter(
      (item) =>
        !after ||
        Date.parse(item.createdAt) < Date.parse(after.createdAt) ||
        (Date.parse(item.createdAt) === Date.parse(after.createdAt) &&
          item.id < after.id),
    )
    .sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
        (a.id < b.id ? 1 : a.id > b.id ? -1 : 0),
    )
    .slice(0, historyPageSize);
}
