package com.letsgo.devcommunity.domain.member.repository;

import com.letsgo.devcommunity.domain.member.entity.Follow;
import com.letsgo.devcommunity.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByFromMemberAndToMember(Member fromMember, Member toMember);

    Optional<Follow> findByFromMemberAndToMember(Member fromMember, Member toMember);

    int countByToMember(Member toMember);

    int countByFromMember(Member fromMember);

    List<Follow> findAllByToMember(Member toMember);

    List<Follow> findAllByFromMember(Member fromMember);
}
