import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    // Admin / staff login (email + password)
    Credentials({
      id: "admin-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nameEn,
          role: user.role,
          userType: "ADMIN",
        };
      },
    }),

    // Member portal login (phone + password)
    Credentials({
      id: "member-credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ phone: z.string().min(1), password: z.string().min(1) })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const normalizedPhone = normalizePhone(parsed.data.phone);

        const candidates = await prisma.member.findMany({
          where: { portalApproved: true, portalPassword: { not: null } },
          select: {
            id: true, memberId: true, nameKh: true, nameEn: true,
            email: true, phone: true, portalPassword: true,
          },
        });

        const member = candidates.find(
          (m) => normalizePhone(m.phone ?? "") === normalizedPhone
        );

        if (!member?.portalPassword) return null;

        const valid = await bcrypt.compare(parsed.data.password, member.portalPassword);
        if (!valid) return null;

        return {
          id: member.id,
          name: member.nameKh ?? member.nameEn ?? member.memberId,
          email: member.email ?? undefined,
          memberId: member.memberId,
          userType: "MEMBER",
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.role = u.role as string | undefined;
        token.memberId = u.memberId as string | undefined;
        token.userType = u.userType as "ADMIN" | "MEMBER";
      }
      return token;
    },
    session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = session.user as any;
      s.id = token.id as string;
      s.role = token.role as string | undefined;
      s.memberId = token.memberId as string | undefined;
      s.userType = token.userType as "ADMIN" | "MEMBER";
      return session;
    },
  },
});
