package com.letsgo.devcommunity.domain.auth.repository;

import com.letsgo.devcommunity.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthRepository extends JpaRepository<Member, Long> {
    boolean existsByLoginId(String loginId);
    boolean existsByEmail(String email);
    Optional<Member> findByLoginId(String loginId);
}
