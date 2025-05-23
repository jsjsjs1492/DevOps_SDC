package com.letsgo.devcommunity.domain.member.entity;

import com.letsgo.devcommunity.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String loginId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    public Member(String loginId, String email, String password, String nickname, String profileImageUrl) {
        this.loginId = loginId;
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.profileImageUrl = null;
    }

    public Follow follow(Member to) {
        if (this.equals(to)) {
            throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다.");
        }

        return Follow.builder()
                .fromMember(this)
                .toMember(to)
                .build();
    }
}
